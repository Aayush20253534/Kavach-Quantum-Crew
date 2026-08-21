import { ApiError } from "../../common/errors/ApiError.js";
import { zoneContainsPoint, zoneIsEffective } from "../../common/utils/geofence.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { riskZoneRepository } from "./risk-zone.repository.js";

const STAFF = new Set(["DISASTER_MANAGER", "SYSTEM_ADMIN"]);

const cleanGeometry = (input) => input.geometryType === "POLYGON"
  ? { ...input, latitude: null, longitude: null, radiusM: null }
  : { ...input, polygon: null };

export const createRiskZoneService = ({ repository = riskZoneRepository, publisher = realtimePublisher, clock = () => new Date() } = {}) => {
  const requireStaff = (actor) => {
    if (!STAFF.has(actor.role)) throw ApiError.forbidden("Risk zone management requires staff access", { code: "RISK_ZONE_MANAGE_FORBIDDEN" });
  };
  const existing = async (id) => {
    const zone = await repository.findById(id);
    if (!zone) throw ApiError.notFound("Risk zone not found", { code: "RISK_ZONE_NOT_FOUND" });
    return zone;
  };
  const audit = (actor, action, zone, metadata = {}) => repository.createAudit({ actorId: actor.id, actorRole: actor.role, action, entityId: zone.id, metadata });

  return Object.freeze({
    async create(actor, input) {
      requireStaff(actor);
      const zone = await repository.create(cleanGeometry({ ...input, createdById: actor.id, createdByRole: actor.role }));
      await audit(actor, "RISK_ZONE_CREATED", zone, { type: zone.type, severity: zone.severity, geometryType: zone.geometryType });
      publisher.publishRiskZoneUpdated?.(zone, { type: "CREATED" });
      return zone;
    },
    async list(actor, query) {
      const staff = STAFF.has(actor.role);
      const rows = await repository.list({ ...query, active: staff ? query.active : true });
      const now = clock();
      return query.effective ? rows.filter((zone) => zoneIsEffective(zone, now)) : rows;
    },
    async get(actor, id) {
      const zone = await existing(id);
      if (!STAFF.has(actor.role) && !zoneIsEffective(zone, clock())) throw ApiError.notFound("Risk zone not found", { code: "RISK_ZONE_NOT_FOUND" });
      return zone;
    },
    async update(actor, id, input) {
      requireStaff(actor);
      const current = await existing(id);
      const geometryType = input.geometryType ?? current.geometryType;
      const merged = { ...current, ...input, geometryType };
      if (
        geometryType === "CIRCLE" &&
        ((merged.latitude === null || merged.latitude === undefined) ||
          (merged.longitude === null || merged.longitude === undefined) ||
          (merged.radiusM === null || merged.radiusM === undefined))
      ) {
        throw ApiError.badRequest("Circle zones require latitude, longitude and radiusM", { code: "RISK_ZONE_GEOMETRY_INVALID" });
      }
      if (geometryType === "POLYGON" && (!Array.isArray(merged.polygon) || merged.polygon.length < 3)) {
        throw ApiError.badRequest("Polygon zones require at least three vertices", { code: "RISK_ZONE_GEOMETRY_INVALID" });
      }
      if (merged.validFrom && merged.validUntil && new Date(merged.validUntil) <= new Date(merged.validFrom)) {
        throw ApiError.badRequest("validUntil must be after validFrom", { code: "RISK_ZONE_WINDOW_INVALID" });
      }
      const data = cleanGeometry({ ...input, geometryType });
      delete data.id; delete data.createdAt; delete data.updatedAt; delete data.createdById; delete data.createdByRole;
      const zone = await repository.update(id, data);
      await audit(actor, "RISK_ZONE_UPDATED", zone, { geometryType: zone.geometryType });
      publisher.publishRiskZoneUpdated?.(zone, { type: "UPDATED" });
      return zone;
    },
    async setActive(actor, id, active) {
      requireStaff(actor);
      await existing(id);
      const zone = await repository.update(id, { active });
      await audit(actor, active ? "RISK_ZONE_ACTIVATED" : "RISK_ZONE_DEACTIVATED", zone);
      publisher.publishRiskZoneUpdated?.(zone, { type: active ? "ACTIVATED" : "DEACTIVATED" });
      return zone;
    },
    async evaluate(actor, point) {
      const rows = await repository.list({ active: true, limit: 100 });
      const now = clock();
      const matches = rows.filter((zone) => zoneIsEffective(zone, now) && zoneContainsPoint(zone, point));
      const risks = matches.filter((zone) => zone.type === "RISK");
      const level = risks.some((z) => ["HIGH", "CRITICAL"].includes(z.severity)) ? "DANGER" : risks.length ? "WARNING" : "SAFE";
      return { level, matches };
    },
  });
};

export const riskZoneService = createRiskZoneService();
export default riskZoneService;
