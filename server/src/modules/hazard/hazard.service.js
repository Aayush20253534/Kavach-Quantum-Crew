import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { hazardRepository } from "./hazard.repository.js";

const toRadians = (degrees) => degrees * Math.PI / 180;
const distanceKm = (aLat, aLon, bLat, bLon) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const boundsForRadius = (latitude, longitude, radiusKm) => {
  const latDelta = radiusKm / 111.32;
  const lonScale = Math.max(Math.cos(toRadians(latitude)), 0.01);
  const lonDelta = radiusKm / (111.32 * lonScale);
  return {
    minLat: Math.max(-90, latitude - latDelta),
    maxLat: Math.min(90, latitude + latDelta),
    minLon: Math.max(-180, longitude - lonDelta),
    maxLon: Math.min(180, longitude + lonDelta),
  };
};

export const createHazardService = ({ repository = hazardRepository, publisher = realtimePublisher, clock = () => new Date() } = {}) => {
  const getExisting = async (id) => {
    const hazard = await repository.findById(id);
    if (!hazard) throw ApiError.notFound("Hazard report not found", { code: "HAZARD_NOT_FOUND" });
    return hazard;
  };

  const requireStaff = (actor) => {
    if (![ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN].includes(actor.role)) {
      throw ApiError.forbidden("Hazard moderation requires disaster management access", { code: "HAZARD_MODERATION_FORBIDDEN" });
    }
  };

  const transition = async (actor, id, nextStatus, note) => {
    requireStaff(actor);
    const current = await getExisting(id);
    if (nextStatus === "VERIFIED" && current.status !== "PENDING") {
      throw ApiError.conflict("Only pending hazards can be verified", { code: "HAZARD_STATE_CONFLICT" });
    }
    if (nextStatus === "REJECTED" && current.status !== "PENDING") {
      throw ApiError.conflict("Only pending hazards can be rejected", { code: "HAZARD_STATE_CONFLICT" });
    }
    if (nextStatus === "RESOLVED" && current.status !== "VERIFIED") {
      throw ApiError.conflict("Only verified hazards can be resolved", { code: "HAZARD_STATE_CONFLICT" });
    }

    const now = clock();
    const updated = await repository.moderate(id, {
      status: nextStatus,
      moderationNote: note ?? null,
      reviewedById: actor.id,
      reviewedByRole: actor.role,
      ...(nextStatus === "VERIFIED" ? { verifiedAt: now, resolvedAt: null } : {}),
      ...(nextStatus === "REJECTED" ? { rejectedAt: now } : {}),
      ...(nextStatus === "RESOLVED" ? { resolvedAt: now } : {}),
    });
    await repository.createAudit({
      actorId: actor.id, actorRole: actor.role, action: `HAZARD_${nextStatus}`, entityId: id, metadata: { note: note ?? null },
    });
    publisher.publishHazardUpdated(updated, { type: nextStatus });
    return updated;
  };

  return Object.freeze({
    async create(actor, input) {
      if (actor.role !== ROLES.TOURIST) {
        throw ApiError.forbidden("Only tourists can submit hazard reports", { code: "HAZARD_REPORT_FORBIDDEN" });
      }
      const created = await repository.create({
        reporterId: actor.id, reporterRole: actor.role, type: input.type, severity: input.severity,
        title: input.title, description: input.description, latitude: input.latitude, longitude: input.longitude,
        locationName: input.locationName ?? null, occurredAt: input.occurredAt ?? clock(),
      });
      await repository.createAudit({ actorId: actor.id, actorRole: actor.role, action: "HAZARD_REPORTED", entityId: created.id, metadata: { type: created.type, severity: created.severity } });
      publisher.publishHazardCreated(created);
      return created;
    },

    list(actor, query) {
      if (query.mine && actor.role !== ROLES.TOURIST) {
        throw ApiError.badRequest("mine=true is only valid for tourist accounts", { code: "HAZARD_SCOPE_INVALID" });
      }
      const status = actor.role === ROLES.TOURIST && !query.mine ? "VERIFIED" : query.status;
      return repository.list({ ...query, status, actorId: actor.id });
    },

    async get(actor, id) {
      const hazard = await getExisting(id);
      const staff = [ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN].includes(actor.role);
      if (!staff && hazard.status !== "VERIFIED" && hazard.reporterId !== actor.id) {
        throw ApiError.notFound("Hazard report not found", { code: "HAZARD_NOT_FOUND" });
      }
      return hazard;
    },

    async nearby(_actor, query) {
      const bounds = boundsForRadius(query.latitude, query.longitude, query.radiusKm);
      const candidates = await repository.nearby({ ...query, ...bounds });
      return candidates
        .map((hazard) => ({ ...hazard, distanceKm: Number(distanceKm(query.latitude, query.longitude, hazard.latitude, hazard.longitude).toFixed(3)) }))
        .filter((hazard) => hazard.distanceKm <= query.radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, query.limit);
    },

    verify: (actor, id, note) => transition(actor, id, "VERIFIED", note),
    reject: (actor, id, note) => transition(actor, id, "REJECTED", note),
    resolve: (actor, id, note) => transition(actor, id, "RESOLVED", note),
  });
};

export const hazardService = createHazardService();
export default hazardService;
