import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { systemAdminRepository } from "./system-admin.repository.js";

export const createSystemAdminService = ({ repository = systemAdminRepository } = {}) => {
  const requireAdmin = (actor) => {
    if (actor.role !== ROLES.SYSTEM_ADMIN) {
      throw ApiError.forbidden("System administrator access required", { code: "SYSTEM_ADMIN_REQUIRED" });
    }
  };

  const getAccount = async (role, id) => {
    const account = await repository.findAccount(role, id);
    if (!account) throw ApiError.notFound("Account not found", { code: "ADMIN_ACCOUNT_NOT_FOUND" });
    return { ...account, role };
  };

  return Object.freeze({
    dashboard(actor) {
      requireAdmin(actor);
      return repository.dashboard();
    },

    listAccounts(actor, query) {
      requireAdmin(actor);
      return repository.listAccounts(query);
    },

    async getAccount(actor, role, id) {
      requireAdmin(actor);
      return getAccount(role, id);
    },

    async setAccountStatus(actor, role, id, status, reason) {
      requireAdmin(actor);
      const current = await getAccount(role, id);
      if (role === ROLES.SYSTEM_ADMIN && id === actor.id && status !== "ACTIVE") {
        throw ApiError.conflict("System admins cannot deactivate their own account", { code: "ADMIN_SELF_DEACTIVATION_FORBIDDEN" });
      }
      if (current.status === status) return current;
      const updated = await repository.updateAccountStatus(role, id, status);
      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "ADMIN_ACCOUNT_STATUS_CHANGED",
        entityType: role,
        entityId: id,
        metadata: { previousStatus: current.status, status, reason: reason ?? null },
      });
      return updated;
    },

    listResource(actor, resource, query) {
      requireAdmin(actor);
      return repository.listResource(resource, query);
    },
  });
};

export const systemAdminService = createSystemAdminService();
export default systemAdminService;
