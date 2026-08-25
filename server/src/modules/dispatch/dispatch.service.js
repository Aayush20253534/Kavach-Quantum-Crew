import { ApiError } from "../../common/errors/ApiError.js";
import { haversineDistanceM } from "../../common/utils/geo.js";
import { ROLES } from "../../constants/roles.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { dispatchRepository } from "./dispatch.repository.js";

const STAFF = new Set([ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN]);
const TERMINAL = new Set(["COMPLETED", "CANCELLED"]);
const NEXT = Object.freeze({ ASSIGNED: "DISPATCHED", DISPATCHED: "EN_ROUTE", EN_ROUTE: "ON_SCENE", ON_SCENE: "COMPLETED" });

export const createDispatchService = ({ repository = dispatchRepository, publisher = realtimePublisher, clock = () => new Date() } = {}) => {
  const staffOnly = (actor) => { if (!STAFF.has(actor.role)) throw ApiError.forbidden("Emergency staff access required", { code: "DISPATCH_FORBIDDEN" }); };
  const adminOnly = (actor) => { if (actor.role !== ROLES.SYSTEM_ADMIN) throw ApiError.forbidden("System admin access required", { code: "UNIT_MANAGE_FORBIDDEN" }); };
  const getDispatch = async (id) => { const row = await repository.findDispatch(id); if (!row) throw ApiError.notFound("Dispatch not found", { code: "DISPATCH_NOT_FOUND" }); return row; };
  const getUnit = async (id) => { const row = await repository.findUnit(id); if (!row) throw ApiError.notFound("Emergency unit not found", { code: "EMERGENCY_UNIT_NOT_FOUND" }); return row; };
  const ensureAssignableUnit = async (unitId, expectedType) => { const unit = await getUnit(unitId); if (unit.status !== "AVAILABLE") throw ApiError.conflict("Emergency unit is unavailable", { code: "EMERGENCY_UNIT_UNAVAILABLE" }); if (expectedType && unit.type !== expectedType) throw ApiError.conflict("Emergency unit type does not match dispatch request", { code: "EMERGENCY_UNIT_TYPE_MISMATCH" }); return unit; };
  const record = async (dispatch, actor, type, note, metadata = {}) => { await repository.createEvent({ dispatchId: dispatch.id, type, actorId: actor.id, actorRole: actor.role, note: note ?? null, metadata }); await repository.createAudit({ actorId: actor.id, actorRole: actor.role, action: `DISPATCH_${type}`, entityId: dispatch.id, metadata }); publisher.publishDispatchUpdated?.(dispatch, { type, actorId: actor.id }); return dispatch; };

  return Object.freeze({
    async createUnit(actor, input) { adminOnly(actor); const unit = await repository.createUnit({ ...input, status: "AVAILABLE" }); await repository.createAudit({ actorId: actor.id, actorRole: actor.role, action: "EMERGENCY_UNIT_CREATED", entityId: unit.id, metadata: { type: unit.type } }); publisher.publishEmergencyUnitUpdated?.(unit, { type: "CREATED" }); return unit; },
    async listUnits(actor, query) {
      staffOnly(actor);
      const jurisdiction =
        actor.role === ROLES.DISASTER_MANAGER
          ? await repository.findResponderJurisdiction(actor.id)
          : null;

      return repository.listUnits({ ...query, jurisdiction });
    },
    async setUnitStatus(actor, id, status) { adminOnly(actor); const unit = await getUnit(id); if (unit.status === "DISPATCHED" && status === "OUT_OF_SERVICE") throw ApiError.conflict("Dispatched unit cannot be taken out of service", { code: "EMERGENCY_UNIT_ACTIVE" }); const updated = await repository.updateUnit(id, { status }); await repository.createAudit({ actorId: actor.id, actorRole: actor.role, action: "EMERGENCY_UNIT_STATUS_CHANGED", entityId: id, metadata: { status } }); publisher.publishEmergencyUnitUpdated?.(updated, { type: "STATUS_CHANGED" }); return updated; },
    async create(actor, incidentId, input) { staffOnly(actor); const incident = await repository.findIncident(incidentId); if (!incident) throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" }); if (["RESOLVED", "DISMISSED"].includes(incident.status)) throw ApiError.conflict("Closed incident cannot be dispatched", { code: "INCIDENT_CLOSED" }); let unit = null; if (input.unitId) unit = await ensureAssignableUnit(input.unitId, input.unitType); const now = clock(); const dispatch = await repository.createDispatch({ incidentId, requestedUnitType: input.unitType, unitId: unit?.id ?? null, status: unit ? "ASSIGNED" : "REQUESTED", requestedById: actor.id, requestedByRole: actor.role, requestedAt: now, assignedAt: unit ? now : null }); if (unit) await repository.updateUnit(unit.id, { status: "DISPATCHED" }); return record(dispatch, actor, unit ? "ASSIGNED" : "REQUESTED", input.note, { unitId: unit?.id ?? null }); },
    async autoAssign(actor, incidentId, serviceType, input = {}) {
      staffOnly(actor);
      const type = serviceType.toUpperCase();
      const incident = await repository.findIncident(incidentId);
      if (!incident) throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" });
      if (["RESOLVED", "DISMISSED"].includes(incident.status)) throw ApiError.conflict("Closed incident cannot be dispatched", { code: "INCIDENT_CLOSED" });
      if (incident.latitude == null || incident.longitude == null) throw ApiError.conflict("Incident location is required for nearest-unit auto assignment", { code: "INCIDENT_LOCATION_REQUIRED" });
      const available = await repository.listAvailableUnitsByType(type);
      if (!available.length) throw ApiError.conflict(`No available ${type.toLowerCase()} unit has a live location`, { code: "NO_AVAILABLE_EMERGENCY_UNIT", details: { type } });
      const incidentPoint = { latitude: incident.latitude, longitude: incident.longitude };
      const ranked = available
        .map((unit) => ({ unit, distanceM: haversineDistanceM(incidentPoint, { latitude: unit.latitude, longitude: unit.longitude }) }))
        .sort((a, b) => a.distanceM - b.distanceM);
      const selected = await ensureAssignableUnit(ranked[0].unit.id, type);
      const now = clock();
      const dispatch = await repository.createDispatch({ incidentId, requestedUnitType: type, unitId: selected.id, status: "ASSIGNED", requestedById: actor.id, requestedByRole: actor.role, requestedAt: now, assignedAt: now });
      await repository.updateUnit(selected.id, { status: "DISPATCHED" });
      return record(dispatch, actor, "ASSIGNED", input.note, { unitId: selected.id, autoAssigned: true, distanceM: Math.round(ranked[0].distanceM), incidentSource: incident.sourceType });
    },
    async assign(actor, id, input) { staffOnly(actor); const current = await getDispatch(id); if (TERMINAL.has(current.status)) throw ApiError.conflict("Closed dispatch cannot be assigned", { code: "DISPATCH_CLOSED" }); if (current.unitId) throw ApiError.conflict("Dispatch already has an assigned unit", { code: "DISPATCH_ALREADY_ASSIGNED" }); const unit = await ensureAssignableUnit(input.unitId, current.requestedUnitType); const now = clock(); const updated = await repository.updateDispatch(id, { unitId: unit.id, status: "ASSIGNED", assignedAt: now }); await repository.updateUnit(unit.id, { status: "DISPATCHED" }); return record(updated, actor, "ASSIGNED", input.note, { unitId: unit.id }); },
    async transition(actor, id, status, note) { staffOnly(actor); const current = await getDispatch(id); if (TERMINAL.has(current.status)) return current; if (status === "CANCELLED") { const updated = await repository.updateDispatch(id, { status, cancelledAt: clock() }); if (current.unitId) await repository.updateUnit(current.unitId, { status: "AVAILABLE" }); return record(updated, actor, "CANCELLED", note); } if (!current.unitId) throw ApiError.conflict("Dispatch requires an assigned unit", { code: "DISPATCH_UNIT_REQUIRED" }); if (NEXT[current.status] !== status) throw ApiError.conflict("Invalid dispatch transition", { code: "DISPATCH_INVALID_TRANSITION", details: { current: current.status, requested: status } }); const now = clock(); const data = { status, ...(status === "DISPATCHED" ? { dispatchedAt: now } : {}), ...(status === "EN_ROUTE" ? { enRouteAt: now } : {}), ...(status === "ON_SCENE" ? { onSceneAt: now } : {}), ...(status === "COMPLETED" ? { completedAt: now } : {}) }; const updated = await repository.updateDispatch(id, data); if (status === "COMPLETED") await repository.updateUnit(current.unitId, { status: "AVAILABLE" }); return record(updated, actor, status, note); },
    async get(actor, id) { staffOnly(actor); return getDispatch(id); },
    async listForIncident(actor, incidentId) { staffOnly(actor); const incident = await repository.findIncident(incidentId); if (!incident) throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" }); return repository.listForIncident(incidentId); },
  });
};
export const dispatchService = createDispatchService();
export default dispatchService;
