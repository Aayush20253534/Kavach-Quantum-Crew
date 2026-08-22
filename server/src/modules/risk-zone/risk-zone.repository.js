import { prisma } from "../../config/database.js";

export const createRiskZoneRepository = ({ db = prisma } = {}) => ({
  create(data) { return db.safetyZone.create({ data }); },
  findById(id) { return db.safetyZone.findUnique({ where: { id } }); },
  list({ type, severity, geometryType, active, limit }) {
    return db.safetyZone.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(severity ? { severity } : {}),
        ...(geometryType ? { geometryType } : {}),
        ...(active === null || active === undefined ? {} : { active }),
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  },
  update(id, data) { return db.safetyZone.update({ where: { id }, data }); },
  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole, action, entityType: "SafetyZone", entityId, metadata } });
  },
});

export const riskZoneRepository = createRiskZoneRepository();
export default riskZoneRepository;
