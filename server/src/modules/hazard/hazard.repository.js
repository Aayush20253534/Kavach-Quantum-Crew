import { prisma } from "../../config/database.js";

export const createHazardRepository = ({ db = prisma } = {}) => ({
  create(data) {
    return db.hazardReport.create({ data });
  },

  findById(id) {
    return db.hazardReport.findUnique({ where: { id } });
  },

  list({ actorId, mine, status, type, severity, limit }) {
    return db.hazardReport.findMany({
      where: {
        ...(mine ? { reporterId: actorId } : {}),
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(severity ? { severity } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
    });
  },

  nearby({ minLat, maxLat, minLon, maxLon, type, severity, limit }) {
    return db.hazardReport.findMany({
      where: {
        status: "VERIFIED",
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLon, lte: maxLon },
        ...(type ? { type } : {}),
        ...(severity ? { severity } : {}),
      },
      orderBy: [{ severity: "desc" }, { verifiedAt: "desc" }],
      take: Math.min(limit * 4, 400),
    });
  },

  moderate(id, data) {
    return db.hazardReport.update({ where: { id }, data });
  },

  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({
      data: { actorId, actorRole, action, entityType: "HazardReport", entityId, metadata },
    });
  },
});

export const hazardRepository = createHazardRepository();
export default hazardRepository;
