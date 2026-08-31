import { prisma } from "../../config/database.js";

const SOLO_SOURCE_ID = "solo-signal-loss";

export const createSignalLossRepository = ({ db = prisma } = {}) => ({
  listActiveGroupTrips(limit = 100) {
    return db.trip.findMany({
      where: { status: "ACTIVE", tripType: "GROUP", group: { isNot: null } },
      include: {
        group: {
          include: {
            leader: { select: { id: true, name: true, email: true, phone: true } },
            members: {
              where: { leftAt: null },
              include: { user: { select: { id: true, name: true, email: true, phone: true } } },
            },
          },
        },
        monitoringPolicy: true,
      },
      take: limit,
    });
  },
  listActiveSoloTrips(limit = 100) {
    return db.trip.findMany({
      where: { status: "ACTIVE", tripType: "SOLO" },
      include: {
        tourist: { select: { id: true, name: true, email: true, phone: true } },
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
  findTripStatus(tripId) { return db.trip.findUnique({ where: { id: tripId }, select: { status: true, tripType: true, touristId: true } }); },
  listForLeader(leaderId, tripId) {
    return db.signalLossCase.findMany({
      where: { leaderId, ...(tripId ? { tripId } : {}), status: "WAITING_FOR_LEADER" },
      orderBy: { detectedAt: "desc" },
      take: 50,
    });
  },
  createSafetyAlert(data) { return db.safetyAlert.create({ data }); },
  updateSafetyAlert(id, data) { return db.safetyAlert.update({ where: { id }, data }); },
  findAlertByCase(tripId, userId, caseId) {
    return db.safetyAlert.findFirst({ where: { tripId, userId, type: "TRACKING_INTERRUPTION", sourceId: caseId } });
  },
  findOpenSoloAlert(tripId, userId) {
    return db.safetyAlert.findFirst({
      where: {
        tripId,
        userId,
        type: "TRACKING_INTERRUPTION",
        sourceId: SOLO_SOURCE_ID,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      orderBy: { createdAt: "desc" },
    });
  },
  findSoloAlertForTourist(alertId, userId) {
    return db.safetyAlert.findFirst({
      where: {
        id: alertId,
        userId,
        type: "TRACKING_INTERRUPTION",
        sourceId: SOLO_SOURCE_ID,
      },
    });
  },
  listSoloAlertsForTourist(userId, tripId) {
    return db.safetyAlert.findMany({
      where: {
        userId,
        ...(tripId ? { tripId } : {}),
        type: "TRACKING_INTERRUPTION",
        sourceId: SOLO_SOURCE_ID,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  },
  findIncidentByAlert(alertId) {
    return db.incident.findUnique({ where: { sourceSafetyAlertId: alertId } });
  },
  findOpenSeparationAlert(tripId, userId) {
    return db.safetyAlert.findFirst({
      where: { tripId, userId, type: "GROUP_SEPARATION", sourceId: "group-centroid-separation", status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      orderBy: { createdAt: "desc" },
    });
  },
  listSeparationAlertsForUser(userId, tripId) {
    return db.safetyAlert.findMany({
      where: { ...(tripId ? { tripId } : {}), type: "GROUP_SEPARATION", sourceId: "group-centroid-separation", status: { in: ["OPEN", "ACKNOWLEDGED"] }, OR: [{ userId }, { details: { path: ["leaderId"], equals: userId } }] },
      orderBy: { createdAt: "desc" }, take: 20,
    });
  },
  findSeparationAlertForResponder(alertId, userId) {
    return db.safetyAlert.findFirst({
      where: { id: alertId, type: "GROUP_SEPARATION", sourceId: "group-centroid-separation", OR: [{ userId }, { details: { path: ["leaderId"], equals: userId } }] },
    });
  },
  resolveAlertByCase(tripId, userId, caseId, now) {
    return db.safetyAlert.updateMany({
      where: { tripId, userId, type: "TRACKING_INTERRUPTION", sourceId: caseId, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      data: { status: "RESOLVED", resolvedAt: now },
    });
  },
  resolveSoloAlert(tripId, userId, now) {
    return db.safetyAlert.updateMany({
      where: {
        tripId,
        userId,
        type: "TRACKING_INTERRUPTION",
        sourceId: SOLO_SOURCE_ID,
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
      data: { status: "RESOLVED", resolvedAt: now },
    });
  },
  createAudit({ actorId, actorRole = "TOURIST", action, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole, action, entityType: "SignalLossCase", entityId, metadata } });
  },
});

export const signalLossRepository = createSignalLossRepository();
export default signalLossRepository;
