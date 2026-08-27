import { prisma } from "../../config/database.js";

export const createSignalLossRepository = ({ db = prisma } = {}) => ({
  listActiveGroupTrips(limit = 100) {
    return db.trip.findMany({
      where: { status: "ACTIVE", tripType: "GROUP", group: { isNot: null } },
      include: {
        group: {
          include: {
            leader: { select: { id: true, name: true, email: true } },
            members: {
              where: { leftAt: null },
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        monitoringPolicy: true,
      },
      take: limit,
    });
  },
  findLatest(tripId, userId) {
    return db.latestTrustedLocation.findUnique({ where: { tripId_userId: { tripId, userId } } });
  },
  findOpenCase(tripId, userId) {
    return db.signalLossCase.findFirst({
      where: { tripId, userId, status: { in: ["WAITING_FOR_LEADER", "ESCALATED", "FALSE_ALARM"] } },
      orderBy: { detectedAt: "desc" },
    });
  },
  createCase(data) { return db.signalLossCase.create({ data }); },
  updateCase(id, data) { return db.signalLossCase.update({ where: { id }, data }); },
  findCase(id) { return db.signalLossCase.findUnique({ where: { id } }); },
  findTripStatus(tripId) { return db.trip.findUnique({ where: { id: tripId }, select: { status: true } }); },
  listForLeader(leaderId, tripId) {
    return db.signalLossCase.findMany({
      where: { leaderId, ...(tripId ? { tripId } : {}), status: "WAITING_FOR_LEADER" },
      orderBy: { detectedAt: "desc" },
      take: 50,
    });
  },
  createSafetyAlert(data) { return db.safetyAlert.create({ data }); },
  findAlertByCase(tripId, userId, caseId) {
    return db.safetyAlert.findFirst({ where: { tripId, userId, type: "TRACKING_INTERRUPTION", sourceId: caseId } });
  },
  resolveAlertByCase(tripId, userId, caseId, now) {
    return db.safetyAlert.updateMany({
      where: { tripId, userId, type: "TRACKING_INTERRUPTION", sourceId: caseId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      data: { status: "RESOLVED", resolvedAt: now },
    });
  },
  createAudit({ actorId, actorRole = "TOURIST", action, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole, action, entityType: "SignalLossCase", entityId, metadata } });
  },
});

export const signalLossRepository = createSignalLossRepository();
export default signalLossRepository;
