import { prisma } from "../../config/database.js";

const tripInclude = {
  safetyId: true,
  consents: { orderBy: { createdAt: "asc" } },
  group: {
    include: {
      members: { where: { leftAt: null }, select: { id: true, userId: true } },
    },
  },
};

export const createTripRepository = ({ db = prisma } = {}) => ({
  findTourist(userId) {
    return db.user.findUnique({
      where: { id: userId },
      select: { id: true, onboardingCompleted: true, status: true, dateOfBirth: true },
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
        aiPlan: input.aiPlan ?? undefined,
      },
      include: tripInclude,
    });
  },

  attachAiPlan(tripId, aiPlan) {
    return db.trip.update({
      where: { id: tripId },
      data: { aiPlan },
      include: tripInclude,
    });
  },


  listHistory(userId, { limit, cursor }) {
    return db.trip.findMany({
      where: {
        status: { in: ["COMPLETED", "CANCELLED"] },
        OR: [
          { touristId: userId },
          {
            group: {
              is: {
                members: {
                  some: { userId },
                },
              },
            },
          },
        ],
      },
      include: tripInclude,
      orderBy: [{ endedAt: "desc" }, { cancelledAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async historyIncidentCounts(tripIds) {
    if (!tripIds.length) return new Map();

    const rows = await db.incident.groupBy({
      by: ["tripId"],
      where: { tripId: { in: tripIds } },
      _count: { _all: true },
    });

    return new Map(rows.map((row) => [row.tripId, row._count._all]));
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

  async extendTrip(tripId, plannedEndAt) {
    return db.$transaction(async (transaction) => {
      await transaction.tripSafetyId.updateMany({
        where: { tripId, revokedAt: null },
        data: { expiresAt: plannedEndAt },
      });

      return transaction.trip.update({
        where: { id: tripId },
        data: { plannedEndAt },
        include: tripInclude,
      });
    });
  },

  async expireSafetyState(tripId, now, reason) {
    return db.$transaction(async (transaction) => {
      const incidents = await transaction.incident.findMany({
        where: {
          tripId,
          status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] },
        },
        select: { id: true },
      });
      const incidentIds = incidents.map((incident) => incident.id);

      const activeDispatches = incidentIds.length
        ? await transaction.dispatch.findMany({
            where: {
              incidentId: { in: incidentIds },
              status: { notIn: ["COMPLETED", "CANCELLED"] },
            },
            select: { id: true, unitId: true },
          })
        : [];
      const unitIds = [...new Set(activeDispatches.map((dispatch) => dispatch.unitId).filter(Boolean))];

      await transaction.safetyAlert.updateMany({
        where: { tripId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
        data: { status: "RESOLVED", resolvedAt: now },
      });

      await transaction.signalLossCase.updateMany({
        where: {
          tripId,
          status: { in: ["WAITING_FOR_LEADER", "ESCALATED", "FALSE_ALARM"] },
        },
        data: { status: "RESOLVED", resolvedAt: now },
      });

      if (activeDispatches.length) {
        await transaction.dispatch.updateMany({
          where: { id: { in: activeDispatches.map((dispatch) => dispatch.id) } },
          data: { status: "CANCELLED", cancelledAt: now },
        });
      }
      if (unitIds.length) {
        await transaction.emergencyUnit.updateMany({
          where: { id: { in: unitIds } },
          data: { status: "AVAILABLE" },
        });
      }
      if (incidentIds.length) {
        await transaction.incident.updateMany({
          where: { id: { in: incidentIds } },
          data: {
            status: "DISMISSED",
            dismissedAt: now,
            resolutionNote: `Expired because the associated trip was ${reason}.`,
          },
        });
        await transaction.incidentEvent.createMany({
          data: incidentIds.map((incidentId) => ({
            incidentId,
            type: "DISMISSED",
            note: `Safety incident expired because the associated trip was ${reason}.`,
            metadata: { automatic: true, source: "TRIP_ENDED", reason },
          })),
        });
      }

      return { incidentIds, cancelledDispatchIds: activeDispatches.map((dispatch) => dispatch.id), unitIds };
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

  findEndingSoonTrips(windowStart, windowEnd) {
    return db.trip.findMany({
      where: {
        status: "ACTIVE",
        plannedEndAt: { gte: windowStart, lte: windowEnd },
      },
      include: {
        tourist: { select: { id: true, name: true, email: true } },
        group: {
          include: {
            members: {
              where: { leftAt: null },
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });
  },

  findExpiredActiveTrips(now, limit = 50) {
    return db.trip.findMany({
      where: {
        status: "ACTIVE",
        plannedEndAt: { lte: now },
      },
      select: { id: true, touristId: true, plannedEndAt: true },
      orderBy: { plannedEndAt: "asc" },
      take: limit,
    });
  },

  async findEndedTripsWithActiveSafetyState(limit = 100) {
    const [alerts, incidents, signalCases] = await Promise.all([
      db.safetyAlert.findMany({
        where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } },
        select: { tripId: true },
        distinct: ["tripId"],
        take: limit,
      }),
      db.incident.findMany({
        where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } },
        select: { tripId: true },
        distinct: ["tripId"],
        take: limit,
      }),
      db.signalLossCase.findMany({
        where: { status: { in: ["WAITING_FOR_LEADER", "ESCALATED", "FALSE_ALARM"] } },
        select: { tripId: true },
        distinct: ["tripId"],
        take: limit,
      }),
    ]);
    const tripIds = [...new Set([
      ...alerts.map((row) => row.tripId),
      ...incidents.map((row) => row.tripId),
      ...signalCases.map((row) => row.tripId),
    ])];
    if (!tripIds.length) return [];
    return db.trip.findMany({
      where: { id: { in: tripIds }, status: { in: ["COMPLETED", "CANCELLED"] } },
      select: { id: true, touristId: true, status: true },
      take: limit,
    });
  },

  hasReminderAudit(tripId, userId) {
    return db.auditLog.findFirst({
      where: {
        action: "TRIP_ENDING_REMINDER_SENT",
        entityType: "Trip",
        entityId: `${tripId}:${userId}`,
      },
      select: { id: true },
    });
  },

  createReminderAudit(tripId, userId, plannedEndAt) {
    return db.auditLog.create({
      data: {
        actorId: userId,
        actorRole: "TOURIST",
        action: "TRIP_ENDING_REMINDER_SENT",
        entityType: "Trip",
        entityId: `${tripId}:${userId}`,
        metadata: { tripId, plannedEndAt },
      },
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
