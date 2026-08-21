import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { incidentRepository } from "./incident.repository.js";

const STAFF = new Set([ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN]);
const participant = (trip, userId) => trip?.touristId === userId || Boolean(trip?.group?.members?.some((m) => m.userId === userId));

export const createIncidentService = ({ repository = incidentRepository, clock = () => new Date() } = {}) => {
  const find = async (id) => {
    const incident = await repository.findById(id);
    if (!incident) throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" });
    return incident;
  };
  const visible = async (actor, incident) => {
    if (STAFF.has(actor.role) || incident.userId === actor.id) return;
    if (actor.role === ROLES.TOURIST) {
      const trip = await repository.findTripContext(incident.tripId, actor.id);
      if (trip && participant(trip, actor.id)) return;
    }
    throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" });
  };
  const staffOnly = (actor, code) => {
    if (!STAFF.has(actor.role)) throw ApiError.forbidden("Emergency staff access required", { code });
  };

  return Object.freeze({
    async ingestSafetyAlert(alert) {
      if (!alert?.id) return null;
      const existing = await repository.findBySafetyAlert(alert.id);
      if (existing) return existing;
      const location = await repository.findLatestLocation(alert.tripId, alert.userId);
      return repository.createFromSafetyAlert(alert, location);
    },
    async triggerSos(userId, input) {
      const trip = await repository.findTripContext(input.tripId, userId);
      if (!trip || !participant(trip, userId)) throw ApiError.notFound("Trip not found", { code: "TRIP_NOT_FOUND" });
      if (trip.status !== "ACTIVE") throw ApiError.conflict("SOS requires an active trip", { code: "SOS_TRIP_NOT_ACTIVE" });
      const duplicate = await repository.findOpenSos(input.tripId, userId);
      if (duplicate) throw ApiError.conflict("An active SOS already exists", { code: "SOS_ALREADY_ACTIVE", details: { incidentId: duplicate.id } });
      const location = input.latitude !== undefined
        ? { latitude: input.latitude, longitude: input.longitude, accuracyM: input.accuracyM ?? null }
        : await repository.findLatestLocation(input.tripId, userId);
      const result = await repository.createSos({ ...input, userId, location, now: clock() });
      await repository.createAudit({ actorId: userId, actorRole: ROLES.TOURIST, action: "SOS_TRIGGERED", entityId: result.incident.id, metadata: { tripId: input.tripId, emergencyType: input.emergencyType } });
      return result;
    },
    async getSos(actor, sosId) {
      const sos = await repository.findSos(sosId);
      if (!sos) throw ApiError.notFound("SOS request not found", { code: "SOS_NOT_FOUND" });
      const incident = await find(sos.incidentId); await visible(actor, incident); return { ...sos, incident };
    },
    async listMine(userId, query) {
      const [own, trips] = await Promise.all([repository.listForTourist(userId, query), repository.listVisibleTripIds(userId)]);
      const group = await repository.listForTrips(trips, query);
      const map = new Map([...own, ...group].map((x) => [x.id, x]));
      return [...map.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, query.limit);
    },
    listQueue(actor, query) { staffOnly(actor, "EMERGENCY_QUEUE_FORBIDDEN"); return repository.listQueue(query); },
    async get(actor, id) { const incident = await find(id); await visible(actor, incident); return { ...incident, events: await repository.listEvents(id) }; },
    async acknowledge(actor, id, note) {
      staffOnly(actor, "INCIDENT_ACK_FORBIDDEN"); const incident = await find(id);
      if (["RESOLVED", "DISMISSED"].includes(incident.status)) throw ApiError.conflict("Closed incident cannot be acknowledged", { code: "INCIDENT_CLOSED" });
      if (incident.status !== "OPEN") return incident;
      const now = clock();
      const updated = await repository.transition(id, { status: "ACKNOWLEDGED", acknowledgedById: actor.id, acknowledgedByRole: actor.role, acknowledgedAt: now }, { type: "ACKNOWLEDGED", actorId: actor.id, actorRole: actor.role, note });
      await repository.createAudit({ actorId: actor.id, actorRole: actor.role, action: "INCIDENT_ACKNOWLEDGED", entityId: id }); return updated;
    },
    async startResponse(actor, id, note) {
      staffOnly(actor, "INCIDENT_RESPONSE_FORBIDDEN"); const incident = await find(id);
      if (incident.status === "IN_PROGRESS") return incident;
      if (!["OPEN", "ACKNOWLEDGED"].includes(incident.status)) throw ApiError.conflict("Invalid incident transition", { code: "INCIDENT_INVALID_TRANSITION" });
      const now = clock();
      return repository.transition(id, { status: "IN_PROGRESS", startedAt: now, ...(incident.acknowledgedAt ? {} : { acknowledgedAt: now, acknowledgedById: actor.id, acknowledgedByRole: actor.role }) }, { type: "RESPONSE_STARTED", actorId: actor.id, actorRole: actor.role, note });
    },
    async resolve(actor, id, note) {
      staffOnly(actor, "INCIDENT_RESOLVE_FORBIDDEN"); const incident = await find(id);
      if (incident.status === "RESOLVED") return incident;
      if (incident.status === "DISMISSED") throw ApiError.conflict("Dismissed incident cannot be resolved", { code: "INCIDENT_DISMISSED" });
      const updated = await repository.transition(id, { status: "RESOLVED", resolvedById: actor.id, resolvedByRole: actor.role, resolvedAt: clock(), resolutionNote: note }, { type: "RESOLVED", actorId: actor.id, actorRole: actor.role, note });
      await repository.createAudit({ actorId: actor.id, actorRole: actor.role, action: "INCIDENT_RESOLVED", entityId: id }); return updated;
    },
    async dismiss(actor, id, note) {
      staffOnly(actor, "INCIDENT_DISMISS_FORBIDDEN"); const incident = await find(id);
      if (incident.status === "DISMISSED") return incident;
      if (incident.status === "RESOLVED") throw ApiError.conflict("Resolved incident cannot be dismissed", { code: "INCIDENT_RESOLVED" });
      return repository.transition(id, { status: "DISMISSED", dismissedAt: clock(), resolutionNote: note }, { type: "DISMISSED", actorId: actor.id, actorRole: actor.role, note });
    },
  });
};
export const incidentService = createIncidentService();
export default incidentService;
