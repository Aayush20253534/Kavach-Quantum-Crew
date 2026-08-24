import crypto from "node:crypto";
import { ApiError } from "../../common/errors/ApiError.js";
import { groupRepository } from "./group.repository.js";
import { credentialService } from "../credential/credential.service.js";

const hashToken = (value) => crypto.createHash("sha256").update(value).digest("hex");
const makeToken = () => crypto.randomBytes(32).toString("base64url");
const makeCode = () => `GRP-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

const serializeGroup = (group) => ({
  id: group.id,
  tripId: group.tripId,
  leaderId: group.leaderId,
  status: group.status,
  createdAt: group.createdAt,
  closedAt: group.closedAt,
  trip: group.trip,
  members: (group.members ?? []).map((member) => ({
    id: member.id, userId: member.userId, role: member.role, joinedAt: member.joinedAt, user: member.user,
  })),
});

const requireGroup = async (repository, groupId) => {
  const group = await repository.findGroup(groupId);
  if (!group) throw ApiError.notFound("Group not found", { code: "GROUP_NOT_FOUND" });
  return group;
};
const requireMember = async (repository, groupId, userId) => {
  const member = await repository.findActiveMembership(groupId, userId);
  if (!member) throw ApiError.forbidden("You are not an active member of this group", { code: "GROUP_MEMBERSHIP_REQUIRED" });
  return member;
};
const requireLeader = (group, userId) => {
  if (group.leaderId !== userId) throw ApiError.forbidden("Only the group leader can perform this action", { code: "GROUP_LEADER_REQUIRED" });
};
const requireOpen = (group) => {
  if (group.status !== "ACTIVE" || !["PLANNED", "ACTIVE"].includes(group.trip.status)) {
    throw ApiError.conflict("Group is closed", { code: "GROUP_CLOSED" });
  }
};
const requireMembershipOpen = (group) => {
  if (group.status !== "ACTIVE" || group.trip.status !== "PLANNED") {
    throw ApiError.conflict("Group membership is locked after the trip starts", {
      code: "GROUP_MEMBERSHIP_LOCKED",
      details: { tripStatus: group.trip.status },
    });
  }
};

const validateJoinableInvitation = async (repository, userId, inviteToken, now) => {
  const invitation = await repository.findInvitationByTokenHash(hashToken(inviteToken));
  if (!invitation) throw ApiError.notFound("Invitation not found", { code: "INVITATION_NOT_FOUND" });
  const group = invitation.group;
  requireMembershipOpen(group);
  if (invitation.revokedAt) throw ApiError.badRequest("Invitation has been revoked", { code: "INVITATION_REVOKED" });
  if (new Date(invitation.expiresAt) <= now) throw ApiError.badRequest("Invitation has expired", { code: "INVITATION_EXPIRED" });
  const existing = await repository.findActiveMembership(group.id, userId);
  if (existing) throw ApiError.conflict("You are already a member of this group", { code: "GROUP_MEMBER_EXISTS" });
  const tripMembership = await repository.findMembershipInTrip(group.tripId, userId);
  if (tripMembership) throw ApiError.conflict("You already belong to a group for this trip", { code: "TRIP_GROUP_MEMBERSHIP_EXISTS" });
  const currentTrip = await repository.findOpenTripForUser(userId);
  if (currentTrip && currentTrip.id !== group.tripId) {
    throw ApiError.conflict("Complete or cancel your current trip before joining another group", { code: "CURRENT_TRIP_EXISTS", details: { tripId: currentTrip.id, status: currentTrip.status, locationName: currentTrip.locationName } });
  }
  return { invitation, group };
};

export const createGroupService = ({ repository = groupRepository, clock = () => new Date(), tokenFactory = makeToken, codeFactory = makeCode } = {}) => Object.freeze({
  async createGroup(userId, tripId) {
    const trip = await repository.findTrip(tripId);
    if (!trip || trip.touristId !== userId) throw ApiError.notFound("Trip not found", { code: "TRIP_NOT_FOUND" });
    if (trip.tripType !== "GROUP") throw ApiError.badRequest("Groups can only be created for GROUP trips", { code: "GROUP_TRIP_REQUIRED" });
    if (trip.status !== "PLANNED") throw ApiError.conflict("Group must be created before the trip starts", { code: "TRIP_NOT_PLANNED" });
    if (trip.group) throw ApiError.conflict("This trip already has a group", { code: "GROUP_ALREADY_EXISTS" });
    const group = await repository.createGroup(tripId, userId, clock());
    await credentialService.createGroupCredential({ groupId: group.id, tripId, expiresAt: trip.plannedEndAt });
    await credentialService.ensureIndividual(tripId, userId);
    await repository.createAudit({ actorId: userId, action: "GROUP_CREATED", entityId: group.id, metadata: { tripId } });
    return serializeGroup(group);
  },
  async getGroup(userId, groupId) {
    const group = await requireGroup(repository, groupId);
    await requireMember(repository, groupId, userId);
    return serializeGroup(group);
  },
  async getTripGroup(userId, tripId) {
    const group = await repository.findGroupByTrip(tripId);
    if (!group) throw ApiError.notFound("Group not found", { code: "GROUP_NOT_FOUND" });
    await requireMember(repository, group.id, userId);
    return serializeGroup(group);
  },
  async createInvitation(userId, groupId, expiresInMinutes) {
    const group = await requireGroup(repository, groupId); requireLeader(group, userId); requireMembershipOpen(group);
    const now = clock(); const rawToken = tokenFactory(); const code = codeFactory();
    const invitation = await repository.createInvitation(groupId, { code, tokenHash: hashToken(rawToken), expiresAt: new Date(now.getTime() + expiresInMinutes * 60000) });
    await repository.createAudit({ actorId: userId, action: "GROUP_INVITATION_CREATED", entityId: groupId, metadata: { invitationId: invitation.id, expiresAt: invitation.expiresAt.toISOString() } });
    return { id: invitation.id, groupId, inviteCode: code, inviteToken: rawToken, expiresAt: invitation.expiresAt };
  },
  async revokeInvitation(userId, groupId, invitationId) {
    const group = await requireGroup(repository, groupId); requireLeader(group, userId);
    const invitation = await repository.findInvitation(groupId, invitationId);
    if (!invitation) throw ApiError.notFound("Invitation not found", { code: "INVITATION_NOT_FOUND" });
    if (invitation.revokedAt) return invitation;
    const revoked = await repository.revokeInvitation(invitationId, clock());
    await repository.createAudit({ actorId: userId, action: "GROUP_INVITATION_REVOKED", entityId: groupId, metadata: { invitationId } });
    return revoked;
  },
  async previewJoinGroup(userId, inviteToken) {
    const now = clock();
    const { invitation, group } = await validateJoinableInvitation(repository, userId, inviteToken, now);
    return {
      groupId: group.id,
      tripId: group.tripId,
      inviteExpiresAt: invitation.expiresAt,
      trip: {
        locationName: group.trip.locationName,
        plannedStartAt: group.trip.plannedStartAt,
        plannedEndAt: group.trip.plannedEndAt,
        status: group.trip.status,
      },
      leader: group.members?.find((member) => member.role === "LEADER")?.user ?? null,
      memberCount: group.members?.filter((member) => !member.leftAt).length ?? 0,
    };
  },
  async joinGroup(userId, inviteToken) {
    const now = clock();
    const { invitation, group } = await validateJoinableInvitation(repository, userId, inviteToken, now);
    await repository.joinGroup(group.id, userId, now);
    await credentialService.ensureIndividual(group.tripId, userId);
    await repository.createAudit({ actorId: userId, action: "GROUP_JOINED", entityId: group.id, metadata: { invitationId: invitation.id } });
    return serializeGroup(await repository.findGroup(group.id));
  },
  async leaveGroup(userId, groupId) {
    const group = await requireGroup(repository, groupId); requireOpen(group);
    if (group.leaderId === userId) throw ApiError.conflict("Group leader cannot leave without transferring leadership", { code: "LEADER_CANNOT_LEAVE" });
    const member = await requireMember(repository, groupId, userId);
    await repository.leaveGroup(member.id, clock());
    await credentialService.revokeIndividual(group.tripId, userId, 2);
    await repository.createAudit({ actorId: userId, action: "GROUP_LEFT", entityId: groupId, metadata: { memberId: member.id } });
    return { left: true };
  },
  async removeMember(userId, groupId, memberId) {
    const group = await requireGroup(repository, groupId); requireLeader(group, userId); requireOpen(group);
    const member = await repository.findMember(groupId, memberId);
    if (!member) throw ApiError.notFound("Group member not found", { code: "GROUP_MEMBER_NOT_FOUND" });
    if (member.userId === group.leaderId) throw ApiError.badRequest("Group leader cannot be removed", { code: "LEADER_CANNOT_BE_REMOVED" });
    await repository.leaveGroup(member.id, clock());
    await credentialService.revokeIndividual(group.tripId, member.userId, 2);
    await repository.createAudit({ actorId: userId, action: "GROUP_MEMBER_REMOVED", entityId: groupId, metadata: { memberId, removedUserId: member.userId } });
    return { removed: true };
  },
});

export const groupService = createGroupService();
