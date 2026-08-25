import { prisma } from "../../config/database.js";

const groupInclude = {
  trip: { select: { id: true, touristId: true, tripType: true, status: true, locationName: true, plannedStartAt: true, plannedEndAt: true } },
  members: {
    where: { leftAt: null },
    include: { user: { select: { id: true, name: true, username: true, profilePicUrl: true } } },
    orderBy: { joinedAt: "asc" },
  },
};

export const createGroupRepository = ({ db = prisma } = {}) => ({
  findTrip(tripId) {
    return db.trip.findUnique({ where: { id: tripId }, include: { group: true } });
  },
  findGroup(groupId) {
    return db.tripGroup.findUnique({ where: { id: groupId }, include: groupInclude });
  },
  findGroupByTrip(tripId) {
    return db.tripGroup.findUnique({ where: { tripId }, include: groupInclude });
  },
  findActiveMembership(groupId, userId) {
    return db.groupMember.findFirst({ where: { groupId, userId, leftAt: null } });
  },
  findMembershipInTrip(tripId, userId) {
    return db.groupMember.findFirst({
      where: { userId, leftAt: null, group: { tripId, status: "ACTIVE" } },
    });
  },
  findOpenTripForUser(userId) {
    return db.trip.findFirst({
      where: {
        status: { in: ["PLANNED", "ACTIVE"] },
        OR: [
          { touristId: userId },
          {
            group: {
              is: {
                status: "ACTIVE",
                members: {
                  some: { userId, leftAt: null },
                },
              },
            },
          },
        ],
      },
      select: { id: true, status: true, locationName: true },
      orderBy: { createdAt: "desc" },
    });
  },
  async createGroup(tripId, leaderId, now) {
    return db.$transaction(async (tx) => {
      const leader = await tx.user.findUnique({ where: { id: leaderId }, select: { name: true } });
      const group = await tx.tripGroup.create({ data: { tripId, leaderId, name: `${leader?.name || "Kavach"} Group` } });
      await tx.groupMember.create({ data: { groupId: group.id, userId: leaderId, role: "LEADER", joinedAt: now } });
      return tx.tripGroup.findUnique({ where: { id: group.id }, include: groupInclude });
    });
  },
  createInvitation(groupId, data) {
    return db.groupInvitation.create({ data: { groupId, ...data } });
  },
  findGroupByCredentialId(id) {
    return db.groupTripCredential.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            trip: true,
            members: {
              where: { leftAt: null },
              include: { user: { select: { id: true, name: true, username: true, profilePicUrl: true } } },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
      },
    });
  },
  findGroupByCredentialHash(chainHash) {
    return db.groupTripCredential.findUnique({
      where: { chainHash },
      include: {
        group: {
          include: {
            trip: true,
            members: {
              where: { leftAt: null },
              include: { user: { select: { id: true, name: true, username: true, profilePicUrl: true } } },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
      },
    });
  },
  findInvitationByTokenHash(tokenHash) {
    return db.groupInvitation.findUnique({
      where: { tokenHash },
      include: {
        group: {
          include: {
            trip: true,
            members: {
              where: { leftAt: null },
              include: { user: { select: { id: true, name: true, username: true, profilePicUrl: true } } },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
      },
    });
  },
  revokeInvitation(invitationId, now) {
    return db.groupInvitation.update({ where: { id: invitationId }, data: { revokedAt: now } });
  },
  findInvitation(groupId, invitationId) {
    return db.groupInvitation.findFirst({ where: { id: invitationId, groupId } });
  },
  async createJoinRequest(groupId, userId, groupIdHash, now) {
    return db.groupJoinRequest.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: { groupIdHash, status: "PENDING", requestedAt: now, decidedAt: null },
      create: { groupId, userId, groupIdHash, status: "PENDING", requestedAt: now },
      include: {
        user: { select: { id: true, name: true, username: true, profilePicUrl: true } },
        group: { include: { trip: true } },
      },
    });
  },
  findJoinRequestForUser(requestId, userId) {
    return db.groupJoinRequest.findFirst({
      where: { id: requestId, userId },
      include: { group: { include: { trip: true } } },
    });
  },
  listPendingJoinRequests(groupId) {
    return db.groupJoinRequest.findMany({
      where: { groupId, status: "PENDING" },
      include: { user: { select: { id: true, name: true, username: true, profilePicUrl: true } } },
      orderBy: { requestedAt: "asc" },
    });
  },
  findJoinRequest(groupId, requestId) {
    return db.groupJoinRequest.findFirst({
      where: { id: requestId, groupId },
      include: {
        user: { select: { id: true, name: true, username: true, profilePicUrl: true } },
        group: { include: { trip: true, credential: true } },
      },
    });
  },
  rejectJoinRequest(requestId, now) {
    return db.groupJoinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", decidedAt: now },
    });
  },
  async approveJoinRequest(requestId, groupId, userId, now) {
    return db.$transaction(async (tx) => {
      await tx.groupMember.upsert({
        where: { groupId_userId: { groupId, userId } },
        update: { role: "MEMBER", joinedAt: now, leftAt: null },
        create: { groupId, userId, role: "MEMBER", joinedAt: now },
      });
      return tx.groupJoinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED", decidedAt: now },
      });
    });
  },
  async joinGroup(groupId, userId, now) {
    return db.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: { role: "MEMBER", joinedAt: now, leftAt: null },
      create: { groupId, userId, role: "MEMBER", joinedAt: now },
    });
  },
  leaveGroup(memberId, now) {
    return db.groupMember.update({ where: { id: memberId }, data: { leftAt: now } });
  },
  findMember(groupId, memberId) {
    return db.groupMember.findFirst({ where: { id: memberId, groupId, leftAt: null } });
  },
  createAudit({ actorId, action, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole: "TOURIST", action, entityType: "TripGroup", entityId, metadata } });
  },
});

export const groupRepository = createGroupRepository();
