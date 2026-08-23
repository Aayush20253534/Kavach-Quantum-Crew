import { prisma } from "../../config/database.js";

const tripInclude = {
  safetyId: true,
  consents: { orderBy: { createdAt: "asc" } },
};

export const createTripRepository = ({ db = prisma } = {}) => ({
  findTourist(userId) {
    return db.user.findUnique({
      where: { id: userId },
      select: { id: true, onboardingCompleted: true, status: true },
    });
  },

  findCurrentTrip(userId) {
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
                  some: {
                    userId,
                    leftAt: null,
                  },
                },
              },
            },
          },
        ],
      },
      include: tripInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findByIdForTourist(tripId, userId) {
    return db.trip.findFirst({
      where: { id: tripId, touristId: userId },
      include: tripInclude,
    });
  },

  create(userId, input) {
    return db.trip.create({
      data: {
        touristId: userId,
        locationName: input.locationName,
        tripType: input.tripType,
        plannedStartAt: input.plannedStartAt,
        plannedEndAt: input.plannedEndAt,
      },
      include: tripInclude,
    });
  },

  listHistory(userId, { limit, cursor }) {
    return db.trip.findMany({
      where: {
        touristId: userId,
        status: { in: ["COMPLETED", "CANCELLED"] },
      },
      include: tripInclude,
      orderBy: [{ endedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  upsertConsent(tripId, type, now) {
    return db.tripConsent.upsert({
      where: { tripId_type: { tripId, type } },
      update: { status: "GRANTED", grantedAt: now, revokedAt: null },
      create: { tripId, type, status: "GRANTED", grantedAt: now },
    });
  },

  findConsentById(tripId, consentId) {
    return db.tripConsent.findFirst({ where: { id: consentId, tripId } });
  },

  revokeConsent(consentId, now) {
    return db.tripConsent.update({
      where: { id: consentId },
      data: { status: "REVOKED", revokedAt: now },
    });
  },

  upsertSafetyId(tripId, { publicId, expiresAt, now }) {
    return db.tripSafetyId.upsert({
      where: { tripId },
      update: { publicId, issuedAt: now, expiresAt, revokedAt: null },
      create: { tripId, publicId, issuedAt: now, expiresAt },
    });
  },

  startTrip(tripId, now) {
    return db.trip.update({
      where: { id: tripId },
      data: { status: "ACTIVE", startedAt: now },
      include: tripInclude,
    });
  },

  async completeTrip(tripId, now) {
    return db.$transaction(async (transaction) => {
      await transaction.tripConsent.updateMany({
        where: { tripId, status: "GRANTED" },
        data: { status: "REVOKED", revokedAt: now },
      });
      await transaction.tripSafetyId.updateMany({
        where: { tripId, revokedAt: null },
        data: { revokedAt: now },
      });
      await transaction.tripGroup.updateMany({
        where: { tripId, status: "ACTIVE" },
        data: { status: "CLOSED", closedAt: now },
      });
      return transaction.trip.update({
        where: { id: tripId },
        data: { status: "COMPLETED", endedAt: now },
        include: tripInclude,
      });
    });
  },

  async cancelTrip(tripId, now) {
    return db.$transaction(async (transaction) => {
      await transaction.tripConsent.updateMany({
        where: { tripId, status: "GRANTED" },
        data: { status: "REVOKED", revokedAt: now },
      });
      await transaction.tripSafetyId.updateMany({
        where: { tripId, revokedAt: null },
        data: { revokedAt: now },
      });
      await transaction.tripGroup.updateMany({
        where: { tripId, status: "ACTIVE" },
        data: { status: "CLOSED", closedAt: now },
      });
      return transaction.trip.update({
        where: { id: tripId },
        data: { status: "CANCELLED", cancelledAt: now, endedAt: now },
        include: tripInclude,
      });
    });
  },

  createAudit({ actorId, action, entityId, metadata }) {
    return db.auditLog.create({
      data: {
        actorId,
        actorRole: "TOURIST",
        action,
        entityType: "Trip",
        entityId,
        metadata,
      },
    });
  },
});

export const tripRepository = createTripRepository();
export default tripRepository;
