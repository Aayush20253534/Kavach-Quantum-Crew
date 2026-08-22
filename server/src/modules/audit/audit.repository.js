import { prisma } from "../../config/database.js";

const buildCreatedAt = ({ from, to }) => {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
};

export const createAuditRepository = ({ db = prisma } = {}) => ({
  list({ actorId, actorRole, action, entityType, entityId, from, to, limit }) {
    return db.auditLog.findMany({
      where: {
        ...(actorId ? { actorId } : {}),
        ...(actorRole ? { actorRole } : {}),
        ...(action ? { action } : {}),
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(buildCreatedAt({ from, to }) ? { createdAt: buildCreatedAt({ from, to }) } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  count({ actorId, actorRole, action, entityType, entityId, from, to }) {
    return db.auditLog.count({
      where: {
        ...(actorId ? { actorId } : {}),
        ...(actorRole ? { actorRole } : {}),
        ...(action ? { action } : {}),
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(buildCreatedAt({ from, to }) ? { createdAt: buildCreatedAt({ from, to }) } : {}),
      },
    });
  },

  groupByAction({ from, to, limit = 20 }) {
    return db.auditLog.groupBy({
      by: ["action"],
      where: {
        ...(buildCreatedAt({ from, to }) ? { createdAt: buildCreatedAt({ from, to }) } : {}),
      },
      _count: { _all: true },
      orderBy: { _count: { action: "desc" } },
      take: limit,
    });
  },

  create(data) {
    return db.auditLog.create({ data });
  },
});

export const auditRepository = createAuditRepository();
export default auditRepository;
