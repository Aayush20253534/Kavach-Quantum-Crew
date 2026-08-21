import { prisma } from "../../config/database.js";

export const createMonitoringRepository = ({ db = prisma } = {}) => ({
  findTrip(tripId) {
    return db.trip.findUnique({
      where: { id: tripId },
      include: {
        monitoringPolicy: true,
        group: {
          include: {
            members: { where: { leftAt: null }, select: { userId: true, role: true } },
          },
        },
      },
    });
  },
  findPolicy(tripId) {
    return db.tripMonitoringPolicy.findUnique({ where: { tripId } });
  },
  upsertPolicy(tripId, data) {
    return db.tripMonitoringPolicy.upsert({
      where: { tripId },
      update: data,
      create: { tripId, ...data },
    });
  },
  findLatest(tripId, userId) {
    return db.latestTrustedLocation.findUnique({ where: { tripId_userId: { tripId, userId } } });
  },
  listRecentLocations(tripId, userId, since) {
    return db.locationPing.findMany({
      where: { tripId, userId, trustStatus: "TRUSTED", capturedAt: { gte: since } },
      orderBy: { capturedAt: "asc" },
      take: 200,
      select: { latitude: true, longitude: true, capturedAt: true },
    });
  },
  listLatestForUsers(tripId, userIds) {
    return db.latestTrustedLocation.findMany({ where: { tripId, userId: { in: userIds } } });
  },
  findOpenAlert(tripId, userId, type, sourceId) {
    return db.safetyAlert.findFirst({
      where: { tripId, userId, type, sourceId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      orderBy: { createdAt: "desc" },
    });
  },
  createAlert(data) {
    return db.safetyAlert.create({ data });
  },
  resolveOpenAlert(tripId, userId, type, sourceId, now) {
    return db.safetyAlert.updateMany({
      where: { tripId, userId, type, sourceId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      data: { status: "RESOLVED", resolvedAt: now },
    });
  },
  listActiveTrips(limit = 100) {
    return db.trip.findMany({ where: { status: "ACTIVE" }, select: { id: true, touristId: true }, take: limit });
  },
  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole, action, entityType: "TripMonitoringPolicy", entityId, metadata } });
  },
});

export const monitoringRepository = createMonitoringRepository();
export default monitoringRepository;
