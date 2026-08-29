import { cacheGetOrSet } from "../../common/cache/cache.js";
import { environment } from "../../config/environment.js";
import { prisma } from "../../config/database.js";

const zoneListKey = ({ type, active }) =>
  `safety-zones:list:${type || "all"}:${active === undefined ? "any" : String(active)}`;

export const createSafetyRepository = ({ db = prisma } = {}) => ({
  findTripContext(tripId, userId) {
    return db.trip.findUnique({
      where: { id: tripId },
      include: {
        group: {
          include: {
            members: {
              where: { userId, leftAt: null },
              select: { id: true, userId: true },
            },
          },
        },
      },
    });
  },

  createZone(data) {
    return db.safetyZone.create({ data });
  },

  listZones({ type, active }) {
    return cacheGetOrSet({
      key: zoneListKey({ type, active }),
      ttlSeconds: environment.REDIS_RISK_ZONES_TTL_SECONDS,
      fetcher: () =>
        db.safetyZone.findMany({
          where: { active, ...(type ? { type } : {}) },
          orderBy: [{ type: "asc" }, { name: "asc" }],
        }),
    });
  },

  listActiveZones() {
    return cacheGetOrSet({
      key: "safety-zones:active:all",
      ttlSeconds: environment.REDIS_RISK_ZONES_TTL_SECONDS,
      fetcher: () => db.safetyZone.findMany({ where: { active: true } }),
    });
  },

  createCheckIn(data) {
    return db.tripCheckIn.create({ data });
  },

  findCheckIn(checkInId) {
    return db.tripCheckIn.findUnique({ where: { id: checkInId } });
  },

  listCheckIns(tripId, userId) {
    return db.tripCheckIn.findMany({
      where: { tripId, userId },
      orderBy: { dueAt: "asc" },
    });
  },

  findDueCheckIns(tripId, now) {
    return db.tripCheckIn.findMany({
      where: { tripId, status: "PENDING", dueAt: { lt: now } },
      orderBy: { dueAt: "asc" },
    });
  },

  completeCheckIn(checkInId, now) {
    return db.tripCheckIn.update({
      where: { id: checkInId },
      data: { status: "COMPLETED", checkedInAt: now },
    });
  },

  markCheckInMissed(checkInId, now) {
    return db.tripCheckIn.update({
      where: { id: checkInId },
      data: { status: "MISSED", missedAt: now },
    });
  },

  findLastGeofenceEvent(tripId, userId, zoneId) {
    return db.geofenceEvent.findFirst({
      where: { tripId, userId, zoneId },
      orderBy: { occurredAt: "desc" },
    });
  },

  createGeofenceEvent(data) {
    return db.geofenceEvent.create({ data });
  },

  findOpenAlert(tripId, userId, type, sourceId) {
    return db.safetyAlert.findFirst({
      where: {
        tripId,
        userId,
        type,
        sourceId,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  createAlert(data) {
    return db.safetyAlert.create({ data });
  },

  resolveOpenAlert(tripId, userId, type, sourceId, now) {
    return db.safetyAlert.updateMany({
      where: {
        tripId,
        userId,
        type,
        sourceId,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      data: { status: "RESOLVED", resolvedAt: now },
    });
  },

  listAlerts(tripId, userId, { status, limit }) {
    return db.safetyAlert.findMany({
      where: { tripId, userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  findAlert(alertId) {
    return db.safetyAlert.findUnique({ where: { id: alertId } });
  },

  acknowledgeAlert(alertId, now) {
    return db.safetyAlert.update({
      where: { id: alertId },
      data: { status: "ACKNOWLEDGED", acknowledgedAt: now },
    });
  },

  findLatestLocation(tripId, userId) {
    return db.latestTrustedLocation.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
  },

  createAudit({ actorId, actorRole = "TOURIST", action, entityType, entityId, metadata }) {
    return db.auditLog.create({
      data: { actorId, actorRole, action, entityType, entityId, metadata },
    });
  },
});

export const safetyRepository = createSafetyRepository();
export default safetyRepository;
