import { cacheGetOrSet } from "../../common/cache/cache.js";
import { environment } from "../../config/environment.js";
import { prisma } from "../../config/database.js";

const listKey = ({ type, severity, geometryType, active, limit }) =>
  [
    "risk-zones:list",
    type || "all",
    severity || "all",
    geometryType || "all",
    active === undefined || active === null ? "any" : String(active),
    limit ?? 100,
  ].join(":");

export const createRiskZoneRepository = ({ db = prisma } = {}) => ({
  create(data) { return db.safetyZone.create({ data }); },
  findById(id) {
    return cacheGetOrSet({
      key: `risk-zones:id:${id}`,
      ttlSeconds: environment.REDIS_RISK_ZONES_TTL_SECONDS,
      fetcher: () => db.safetyZone.findUnique({ where: { id } }),
      shouldCache: (value) => value !== null && value !== undefined,
    });
  },
  list({ type, severity, geometryType, active, limit }) {
    const query = { type, severity, geometryType, active, limit };
    return cacheGetOrSet({
      key: listKey(query),
      ttlSeconds: environment.REDIS_RISK_ZONES_TTL_SECONDS,
      fetcher: () =>
        db.safetyZone.findMany({
          where: {
            ...(type ? { type } : {}),
            ...(severity ? { severity } : {}),
            ...(geometryType ? { geometryType } : {}),
            ...(active === null || active === undefined ? {} : { active }),
          },
          orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
          take: limit,
        }),
    });
  },
  update(id, data) { return db.safetyZone.update({ where: { id }, data }); },
  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole, action, entityType: "SafetyZone", entityId, metadata } });
  },
});

export const riskZoneRepository = createRiskZoneRepository();
export default riskZoneRepository;
