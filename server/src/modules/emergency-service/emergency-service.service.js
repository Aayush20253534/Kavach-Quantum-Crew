import { ApiError } from "../../common/errors/ApiError.js";
import { haversineDistanceM } from "../../common/utils/geo.js";
import { hashPassword } from "../../common/utils/password.js";
import { EMERGENCY_SERVICE_ROLES } from "../../constants/roles.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { emergencyServiceRepository } from "./emergency-service.repository.js";

const SERVICE_ROLES = new Set(EMERGENCY_SERVICE_ROLES);
const NEXT = Object.freeze({ ASSIGNED: "DISPATCHED", DISPATCHED: "EN_ROUTE", EN_ROUTE: "ON_SCENE", ON_SCENE: "COMPLETED" });
const publicAccount = (row) => { const copy = { ...row }; delete copy.passwordHash; return copy; };

export const createEmergencyServiceService = ({ repository = emergencyServiceRepository, publisher = realtimePublisher, clock = () => new Date() } = {}) => {
  const serviceOnly = (actor) => { if (!SERVICE_ROLES.has(actor.role)) throw ApiError.forbidden("Emergency service account required", { code: "EMERGENCY_SERVICE_FORBIDDEN" }); };
  const ownedDispatch = async (actor, id) => {
    const dispatch = await repository.findDispatch(id);
    if (!dispatch) throw ApiError.notFound("Dispatch not found", { code: "DISPATCH_NOT_FOUND" });
    if (dispatch.unit?.serviceAccountId !== actor.id || dispatch.requestedUnitType !== actor.role) throw ApiError.forbidden("Dispatch is not assigned to this service account", { code: "DISPATCH_NOT_OWNED" });
    return dispatch;
  };
  return Object.freeze({
    async register(input) {
      const conflict = await repository.findConflict(input);
      if (conflict) throw ApiError.conflict("Emergency service account already exists", { code: "ACCOUNT_ALREADY_EXISTS" });
      const now = clock();
      const { account, unit } = await repository.createAccountWithUnit({
        name: input.name, username: input.username, email: input.email, phone: input.phone,
        passwordHash: await hashPassword(input.password), serviceType: input.serviceType,
        organization: input.organization ?? null, address: input.address ?? null,
        jurisdiction: input.jurisdiction ?? null, latitude: input.latitude, longitude: input.longitude,
        locationUpdatedAt: now,
      }, {
        name: `${input.organization || input.name} Primary Unit`, type: input.serviceType,
        status: "AVAILABLE", organization: input.organization ?? null, jurisdiction: input.jurisdiction ?? null,
        contactPhone: input.phone, latitude: input.latitude, longitude: input.longitude, locationUpdatedAt: now,
      });
      return { account: publicAccount({ ...account, role: account.serviceType }), unit, loginPortalRole: account.serviceType };
    },
    async me(actor) { serviceOnly(actor); const account = await repository.findAccount(actor.id); return publicAccount({ ...account, role: actor.role }); },
    async updateLocation(actor, input) {
      serviceOnly(actor); const now = clock();
      const account = await repository.updateAccount(actor.id, { ...input, locationUpdatedAt: now });
      await repository.updateOwnedUnitsLocation(actor.id, { ...input, locationUpdatedAt: now });
      return publicAccount({ ...account, role: actor.role });
    },
    async dispatches(actor) { serviceOnly(actor); return repository.listDispatches(actor.id); },
    async updateDispatchLocation(actor, id, input) {
      serviceOnly(actor); const dispatch = await ownedDispatch(actor, id); const now = clock();
      const unit = await repository.updateUnit(dispatch.unit.id, { ...input, locationUpdatedAt: now });
      await repository.updateAccount(actor.id, { ...input, locationUpdatedAt: now });
      const fresh = { ...dispatch, unit };
      publisher.publishDispatchUpdated?.(fresh, { type: "LOCATION_UPDATED", location: input });
      publisher.publishEmergencyUnitUpdated?.(unit, { type: "LOCATION_UPDATED" });
      return { dispatchId: id, status: dispatch.status, unit };
    },
    async transition(actor, id, status, note) {
      serviceOnly(actor); const current = await ownedDispatch(actor, id);
      if (["COMPLETED", "CANCELLED"].includes(current.status)) return current;
      if (status === "CANCELLED") throw ApiError.forbidden("Only Disaster Management can cancel a dispatch", { code: "SERVICE_CANCEL_FORBIDDEN" });
      if (NEXT[current.status] !== status) throw ApiError.conflict("Invalid dispatch transition", { code: "DISPATCH_INVALID_TRANSITION", details: { current: current.status, requested: status } });
      const now = clock();
      const data = { status, ...(status === "DISPATCHED" ? { dispatchedAt: now } : {}), ...(status === "EN_ROUTE" ? { enRouteAt: now } : {}), ...(status === "ON_SCENE" ? { onSceneAt: now } : {}), ...(status === "COMPLETED" ? { completedAt: now } : {}) };
      const updated = await repository.updateDispatch(id, data);
      if (status === "COMPLETED") await repository.updateUnit(current.unit.id, { status: "AVAILABLE" });
      await repository.createEvent({ dispatchId: id, type: status, actorId: actor.id, actorRole: actor.role, note: note ?? null, metadata: { servicePortal: true } });
      publisher.publishDispatchUpdated?.(updated, { type: status, actorId: actor.id });
      return updated;
    },
    async touristTracking(actor, id) {
      if (actor.role !== "TOURIST") throw ApiError.forbidden("Tourist access required", { code: "TRACKING_FORBIDDEN" });
      const dispatch = await repository.findDispatch(id);
      if (!dispatch) throw ApiError.notFound("Dispatch not found", { code: "DISPATCH_NOT_FOUND" });
      if (dispatch.incident.userId !== actor.id) throw ApiError.forbidden("This dispatch does not belong to your incident", { code: "TRACKING_FORBIDDEN" });
      const unitLocation = dispatch.unit?.latitude != null && dispatch.unit?.longitude != null ? { latitude: dispatch.unit.latitude, longitude: dispatch.unit.longitude, updatedAt: dispatch.unit.locationUpdatedAt } : null;
      const incidentLocation = dispatch.incident.latitude != null && dispatch.incident.longitude != null ? { latitude: dispatch.incident.latitude, longitude: dispatch.incident.longitude } : null;
      const distanceM = unitLocation && incidentLocation ? Math.round(haversineDistanceM(unitLocation, incidentLocation)) : null;
      return { dispatchId: dispatch.id, serviceType: dispatch.requestedUnitType, status: dispatch.status, unit: dispatch.unit ? { id: dispatch.unit.id, name: dispatch.unit.name, organization: dispatch.unit.organization, location: unitLocation } : null, destination: incidentLocation, distanceRemainingM: distanceM, timeline: dispatch.events };
    },
  });
};

export const emergencyServiceService = createEmergencyServiceService();
