import { prisma } from "../../config/database.js";

const activeConsent = { status: "GRANTED", revokedAt: null };

export const createTrackingRepository = ({ db = prisma } = {}) => ({
  findTripContext(tripId, userId) {
    return db.trip.findUnique({
      where: { id: tripId },
      include: {
        consents: true,
        group: {
          include: {
            members: { where: { userId, leftAt: null }, select: { id: true, userId: true } },
          },
        },
      },
    });
  },
  findParticipantConsent(tripId, userId) {
    return db.tripParticipantConsent.findUnique({ where: { tripId_userId: { tripId, userId } } });
  },
  upsertParticipantConsent(tripId, userId, now) {
    return db.tripParticipantConsent.upsert({
      where: { tripId_userId: { tripId, userId } },
      update: { grantedAt: now, revokedAt: null },
      create: { tripId, userId, grantedAt: now },
    });
  },
  revokeParticipantConsent(tripId, userId, now) {
    return db.tripParticipantConsent.update({
      where: { tripId_userId: { tripId, userId } },
      data: { revokedAt: now },
    });
  },
  findLatest(tripId, userId) {
    return db.latestTrustedLocation.findUnique({ where: { tripId_userId: { tripId, userId } } });
  },
  findDuplicate(tripId, userId, capturedAt) {
    return db.locationPing.findUnique({
      where: { tripId_userId_capturedAt: { tripId, userId, capturedAt } },
    });
  },
  async createPingAndUpdateLatest(data) {
    return db.$transaction(async (tx) => {
      const ping = await tx.locationPing.create({ data });
      await tx.latestTrustedLocation.upsert({
        where: { tripId_userId: { tripId: data.tripId, userId: data.userId } },
        update: {
          locationPingId: ping.id,
          latitude: ping.latitude,
          longitude: ping.longitude,
          accuracyM: ping.accuracyM,
          capturedAt: ping.capturedAt,
        },
        create: {
          tripId: data.tripId,
          userId: data.userId,
          locationPingId: ping.id,
          latitude: ping.latitude,
          longitude: ping.longitude,
          accuracyM: ping.accuracyM,
          capturedAt: ping.capturedAt,
        },
      });
      return ping;
    });
  },
  findGroup(groupId) {
    return db.tripGroup.findUnique({
      where: { id: groupId },
      include: {
        trip: { select: { id: true, status: true } },
        members: {
          where: { leftAt: null },
          include: { user: { select: { id: true, name: true, username: true, profilePicUrl: true } } },
        },
      },
    });
  },
  listLatestForUsers(tripId, userIds) {
    return db.latestTrustedLocation.findMany({
      where: { tripId, userId: { in: userIds } },
    });
  },
  createAudit({ actorId, action, entityId, metadata }) {
    return db.auditLog.create({
      data: { actorId, actorRole: "TOURIST", action, entityType: "Trip", entityId, metadata },
    });
  },
  async canSubscribeToTrip(tripId, userId) {
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: { group: { include: { members: { where: { userId, leftAt: null }, select: { id: true } } } } },
    });
    if (!trip || trip.status !== "ACTIVE") return null;
    if (trip.touristId === userId) return { tripId: trip.id, groupId: trip.group?.id ?? null };
    if (trip.group?.members?.length) return { tripId: trip.id, groupId: trip.group.id };
    return null;
  },
  activeConsent,
});

export const trackingRepository = createTrackingRepository();
