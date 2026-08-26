import { ApiError } from "../../common/errors/ApiError.js";
import { haversineDistanceM } from "../../common/utils/geo.js";
import { hashPassword } from "../../common/utils/password.js";
import { EMERGENCY_SERVICE_ROLES } from "../../constants/roles.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { emergencyServiceRepository } from "./emergency-service.repository.js";

const SERVICE_ROLES = new Set(EMERGENCY_SERVICE_ROLES);
const ACCOUNT_CREATORS = new Set(["DISASTER_MANAGER", "SYSTEM_ADMIN"]);
const SERVICE_LABELS = Object.freeze({ POLICE: "Police", FIRE: "Fire", AMBULANCE: "Ambulance / Hospital" });
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
    async provision(actor, input) {
      if (!ACCOUNT_CREATORS.has(actor.role)) throw ApiError.forbidden("Disaster Management account required", { code: "EMERGENCY_ACCOUNT_CREATE_FORBIDDEN" });
      const conflict = await repository.findConflict(input);
      if (conflict) throw ApiError.conflict("Username, email or phone is already in use", { code: "ACCOUNT_ALREADY_EXISTS" });

      const label = SERVICE_LABELS[input.serviceType] || input.serviceType;
      const now = clock();
      const displayName = input.fleetName;
      const { account, unit } = await repository.createAccountWithUnit({
        name: displayName,
        username: input.username,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        serviceType: input.serviceType,
        organization: input.fleetName,
        address: input.address,
        jurisdiction: input.jurisdiction ?? null,
        latitude: input.latitude,
        longitude: input.longitude,
        locationUpdatedAt: now,
      }, {
        name: input.fleetName,
        type: input.serviceType,
        status: "AVAILABLE",
        organization: input.fleetName,
        jurisdiction: input.jurisdiction ?? null,
        contactPhone: input.phone,
        latitude: input.latitude,
        longitude: input.longitude,
        locationUpdatedAt: now,
      });

      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "EMERGENCY_SERVICE_ACCOUNT_CREATED",
        entityType: "EmergencyServiceAccount",
        entityId: account.id,
        metadata: { serviceType: input.serviceType, username: input.username, email: input.email, fleetName: input.fleetName, address: input.address },
      });

      return {
        account: publicAccount({ ...account, role: account.serviceType }),
        unit,
        loginPortalRole: account.serviceType,
        locationRequired: false,
      };
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
      // Dispatch GPS belongs to the deployed unit only. The service account keeps
      // its fixed/base coordinates so live tracking never overwrites the fleet base.
      const unit = await repository.updateUnit(dispatch.unit.id, { ...input, locationUpdatedAt: now });
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
      const event = {
        dispatchId: id,
        type: status,
        actorId: actor.id,
        actorRole: actor.role,
        note: note ?? null,
        metadata: { servicePortal: true },
      };
      // Keep the status change and timeline event atomic. This also ensures the
      // response contains the unit relation required by realtime room routing.
      const updated = await repository.transitionDispatch(id, data, event);
      let resolvedIncident = null;
      if (status === "COMPLETED") {
        await repository.updateUnit(current.unit.id, {
          status: "AVAILABLE",
          latitude: actor.latitude ?? current.unit.latitude,
          longitude: actor.longitude ?? current.unit.longitude,
          locationUpdatedAt: actor.locationUpdatedAt ?? now,
        });
        // Disaster Management follows Incident state, not Dispatch state. Resolve
        // the incident only after the final active fleet response is completed.
        resolvedIncident = await repository.resolveIncidentWhenResponsesComplete(
          current.incidentId,
          actor,
          now,
        );
      }
      publisher.publishDispatchUpdated?.(updated, { type: status, actorId: actor.id });
      if (resolvedIncident?.status === "RESOLVED") {
        publisher.publishIncidentUpdated?.(resolvedIncident, {
          type: "RESOLVED",
          actorId: actor.id,
          source: "FLEET_COMPLETION",
        });
      }
      return updated;
    },
    async listTouristDispatches(actor) {
      if (actor.role !== "TOURIST") throw ApiError.forbidden("Tourist access required", { code: "TRACKING_FORBIDDEN" });
      return repository.listTouristDispatches(actor.id);
    },
    async tracking(actor, id) {
      const dispatch = await repository.findDispatch(id);
      if (!dispatch) throw ApiError.notFound("Dispatch not found", { code: "DISPATCH_NOT_FOUND" });

      if (actor.role === "TOURIST") {
        const participant = await repository.findTripParticipant(dispatch.incident.tripId, actor.id);
        if (!participant) throw ApiError.forbidden("This dispatch is not visible to your trip", { code: "TRACKING_FORBIDDEN" });
      } else if (actor.role === "DISASTER_MANAGER" || actor.role === "SYSTEM_ADMIN") {
        // Disaster Management and system administrators can observe active fleet response.
      } else if (SERVICE_ROLES.has(actor.role)) {
        if (dispatch.unit?.serviceAccountId !== actor.id) throw ApiError.forbidden("Dispatch is not assigned to this service account", { code: "TRACKING_FORBIDDEN" });
      } else {
        throw ApiError.forbidden("Dispatch tracking access denied", { code: "TRACKING_FORBIDDEN" });
      }

      const unitLocation = dispatch.unit?.latitude != null && dispatch.unit?.longitude != null
        ? { latitude: dispatch.unit.latitude, longitude: dispatch.unit.longitude, updatedAt: dispatch.unit.locationUpdatedAt }
        : null;
      const latestTouristLocation = await repository.findLatestTouristLocation(
        dispatch.incident.tripId,
        dispatch.incident.userId,
      );
      const incidentLocation = dispatch.incident.latitude != null && dispatch.incident.longitude != null
        ? { latitude: dispatch.incident.latitude, longitude: dispatch.incident.longitude }
        : null;
      const destination = latestTouristLocation
        ? {
            latitude: latestTouristLocation.latitude,
            longitude: latestTouristLocation.longitude,
            accuracyM: latestTouristLocation.accuracyM,
            updatedAt: latestTouristLocation.capturedAt ?? latestTouristLocation.updatedAt,
            source: "LIVE_TOURIST",
          }
        : incidentLocation
          ? { ...incidentLocation, source: "INCIDENT_LOCATION" }
          : null;
      const distanceM = unitLocation && destination ? Math.round(haversineDistanceM(unitLocation, destination)) : null;
      return {
        dispatchId: dispatch.id,
        incidentId: dispatch.incidentId,
        serviceType: dispatch.requestedUnitType,
        status: dispatch.status,
        unit: dispatch.unit ? { id: dispatch.unit.id, name: dispatch.unit.name, organization: dispatch.unit.organization, location: unitLocation } : null,
        destination,
        distanceRemainingM: distanceM,
        timeline: dispatch.events,
      };
    },
  });
};

export const emergencyServiceService = createEmergencyServiceService();
