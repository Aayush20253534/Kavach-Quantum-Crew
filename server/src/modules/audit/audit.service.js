import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { auditRepository } from "./audit.repository.js";

const requireAdmin = (actor) => {
  if (actor?.role !== ROLES.SYSTEM_ADMIN) {
    throw ApiError.forbidden("Audit access requires system administrator privileges", {
      code: "AUDIT_ACCESS_FORBIDDEN",
    });
  }
};

const groupCounts = (rows) =>
  Object.fromEntries(rows.map((row) => [row.action, row._count?._all ?? 0]));

export const createAuditService = ({ repository = auditRepository } = {}) =>
  Object.freeze({
    async list(actor, query) {
      requireAdmin(actor);
      const [items, total] = await Promise.all([
        repository.list(query),
        repository.count(query),
      ]);
      return { items, total };
    },

    async summary(actor, query) {
      requireAdmin(actor);
      const rows = await repository.groupByAction(query);
      return {
        byAction: groupCounts(rows),
        total: rows.reduce((sum, row) => sum + (row._count?._all ?? 0), 0),
      };
    },

    async record({ actorId = null, actorRole = null, action, entityType = null, entityId = null, metadata = undefined, ipAddress = null }) {
      return repository.create({
        actorId,
        actorRole,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
      });
    },
  });

export const auditService = createAuditService();
export default auditService;
