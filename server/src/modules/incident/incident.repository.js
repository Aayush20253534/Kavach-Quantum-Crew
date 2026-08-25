import { prisma } from "../../config/database.js";

export const createIncidentRepository = ({ db = prisma } = {}) => ({
  findTripContext(tripId, userId) {
    return db.trip.findUnique({
      where: { id: tripId },
      include: { group: { include: { members: { where: { userId, leftAt: null }, select: { userId: true } } } } },
    });
  },
  findLatestLocation(tripId, userId) {
    return db.latestTrustedLocation.findUnique({ where: { tripId_userId: { tripId, userId } } });
  },
  findById(id) { return db.incident.findUnique({ where: { id } }); },
  findBySafetyAlert(sourceSafetyAlertId) { return db.incident.findUnique({ where: { sourceSafetyAlertId } }); },
  findOpenSos(tripId, userId) {
    return db.incident.findFirst({ where: { tripId, userId, sourceType: "SOS", status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } }, orderBy: { createdAt: "desc" } });
  },
  async createFromSafetyAlert(alert, location) {
    return db.$transaction(async (tx) => {
      const incident = await tx.incident.create({ data: {
        tripId: alert.tripId, userId: alert.userId, sourceType: "SAFETY_ALERT", sourceSafetyAlertId: alert.id,
        severity: alert.level === "DANGER" ? "DANGER" : "WARNING", title: alert.message,
        description: alert.details ? JSON.stringify(alert.details).slice(0, 1000) : null,
        latitude: location?.latitude ?? null, longitude: location?.longitude ?? null,
      } });
      await tx.incidentEvent.create({ data: { incidentId: incident.id, type: "CREATED", metadata: { safetyAlertId: alert.id } } });
      return incident;
    });
  },
  async createSos({ tripId, userId, emergencyType, message, location, now }) {
    return db.$transaction(async (tx) => {
      const incident = await tx.incident.create({ data: {
        tripId, userId, sourceType: "SOS", severity: "CRITICAL", title: `SOS: ${emergencyType.replaceAll("_", " ")}`,
        description: message ?? null, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null,
      } });
      const sos = await tx.sosRequest.create({ data: {
        incidentId: incident.id, tripId, userId, emergencyType, message: message ?? null,
        latitude: location?.latitude ?? null, longitude: location?.longitude ?? null, accuracyM: location?.accuracyM ?? null, triggeredAt: now,
      } });
      await tx.incidentEvent.create({ data: { incidentId: incident.id, type: "CREATED", actorId: userId, actorRole: "TOURIST", metadata: { sosRequestId: sos.id, emergencyType } } });
      return { incident, sos };
    });
  },
  findSos(id) { return db.sosRequest.findUnique({ where: { id } }); },
  listEvents(incidentId) { return db.incidentEvent.findMany({ where: { incidentId }, orderBy: { createdAt: "asc" } }); },
  listNotes(incidentId) { return db.incidentNote.findMany({ where: { incidentId }, orderBy: { createdAt: "asc" } }); },
  addNote(incidentId, actor, note) { return db.incidentNote.create({ data: { incidentId, authorId: actor.id, authorRole: actor.role, note } }); },
  findResponder(id) { return db.disasterManager.findFirst({ where: { id, status: "ACTIVE" }, select: { id: true, responderStatus: true, maxActiveIncidents: true } }); },
  countResponderActiveIncidents(id) { return db.incident.count({ where: { assignedToId: id, assignedToRole: "DISASTER_MANAGER", status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } } }); },
  async assign(id, responderId, responderRole, actor, now) { return db.$transaction(async tx => { await tx.incidentAssignment.updateMany({where:{incidentId:id,unassignedAt:null},data:{unassignedAt:now}}); await tx.incidentAssignment.create({data:{incidentId:id,responderId,responderRole,assignedById:actor.id,assignedByRole:actor.role,assignedAt:now}}); return tx.incident.update({where:{id},data:{assignedToId:responderId,assignedToRole:responderRole,assignedAt:now}}); }); },
  async unassign(id, _actor, now) { return db.$transaction(async tx => { await tx.incidentAssignment.updateMany({where:{incidentId:id,unassignedAt:null},data:{unassignedAt:now}}); return tx.incident.update({where:{id},data:{assignedToId:null,assignedToRole:null,assignedAt:null}}); }); },
  listAssignments(incidentId) { return db.incidentAssignment.findMany({ where: { incidentId }, orderBy: { assignedAt: "asc" } }); },
  listForTourist(userId, { status, limit }) {
    return db.incident.findMany({ where: { userId, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" }, take: limit });
  },
  async listVisibleTripIds(userId) {
    const memberships = await db.groupMember.findMany({ where: { userId, leftAt: null, group: { status: "ACTIVE" } }, select: { group: { select: { tripId: true } } } });
    return memberships.map((x) => x.group.tripId);
  },
  listForTrips(tripIds, { status, limit }) {
    if (!tripIds.length) return [];
    return db.incident.findMany({ where: { tripId: { in: tripIds }, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" }, take: limit });
  },
  listQueue({ status, severity, limit }) {
    return db.incident.findMany({
      where: { ...(status ? { status } : { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } }), ...(severity ? { severity } : {}) },
      orderBy: [{ severity: "desc" }, { createdAt: "asc" }], take: limit,
    });
  },
  async transition(id, data, event) {
    return db.$transaction(async (tx) => {
      const incident = await tx.incident.update({ where: { id }, data });
      await tx.incidentEvent.create({ data: { incidentId: id, ...event } });
      return incident;
    });
  },
  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole, action, entityType: "Incident", entityId, metadata } });
  },
});
export const incidentRepository = createIncidentRepository();
export default incidentRepository;
