import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { systemAdminRepository } from "./system-admin.repository.js";
import { cloudinaryAdapter } from "../../integrations/cloudinary/cloudinary.adapter.js";
import { cacheDeletePrefix } from "../../common/cache/cache.js";

export const createSystemAdminService = ({
  repository = systemAdminRepository,
  imageStorage = cloudinaryAdapter,
  invalidateDestinationCache = () =>
    cacheDeletePrefix({ prefix: "destinations:list:" }),
} = {}) => {
  const requireAdmin = (actor) => {
    if (actor.role !== ROLES.SYSTEM_ADMIN) {
      throw ApiError.forbidden("System administrator access required", { code: "SYSTEM_ADMIN_REQUIRED" });
    }
  };

  const slugify = (value) =>
    String(value)
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  const requireDestination = async (destinationId) => {
    const destination = await repository.findDestination(destinationId);
    if (!destination) {
      throw ApiError.notFound("Destination not found", {
        code: "DESTINATION_NOT_FOUND",
      });
    }
    return destination;
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

    listDestinations(actor, query) {
      requireAdmin(actor);
      return repository.listDestinations(query);
    },

    async createDestination(actor, input) {
      requireAdmin(actor);
      const slug = slugify(input.name);
      const conflict = await repository.findDestinationConflict({
        name: input.name,
        slug,
      });

      if (conflict) {
        throw ApiError.conflict("Destination name already exists", {
          code: "DESTINATION_EXISTS",
        });
      }

      const destination = await repository.createDestination({
        ...input,
        slug,
      });

      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "ADMIN_DESTINATION_CREATED",
        entityType: "DESTINATION",
        entityId: destination.id,
        metadata: {
          name: destination.name,
          state: destination.state,
          country: destination.country,
        },
      });

      await invalidateDestinationCache();
      return destination;
    },

    async updateDestination(actor, destinationId, input) {
      requireAdmin(actor);
      const current = await requireDestination(destinationId);
      const nextName = input.name ?? current.name;
      const slug = input.name ? slugify(input.name) : current.slug;

      if (input.name) {
        const conflict = await repository.findDestinationConflict({
          name: nextName,
          slug,
          excludeId: destinationId,
        });
        if (conflict) {
          throw ApiError.conflict("Destination name already exists", {
            code: "DESTINATION_EXISTS",
          });
        }
      }

      const destination = await repository.updateDestination(destinationId, {
        ...input,
        ...(input.name ? { slug } : {}),
      });

      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "ADMIN_DESTINATION_UPDATED",
        entityType: "DESTINATION",
        entityId: destination.id,
        metadata: { previous: current, current: destination },
      });

      await invalidateDestinationCache();
      return destination;
    },

    async deleteDestination(actor, destinationId) {
      requireAdmin(actor);
      const current = await requireDestination(destinationId);
      const deleted = await repository.deleteDestination(destinationId);

      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "ADMIN_DESTINATION_DELETED",
        entityType: "DESTINATION",
        entityId: destinationId,
        metadata: {
          name: current.name,
          state: current.state,
        },
      });

      await invalidateDestinationCache();
      return deleted;
    },

    async uploadDestinationImage(actor, destinationId, file) {
      requireAdmin(actor);
      await requireDestination(destinationId);

      const uploaded = await imageStorage.uploadDestinationImage({
        destinationId,
        file,
      });

      const destination = await repository.updateDestination(destinationId, {
        imageUrl: uploaded.url,
      });

      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "ADMIN_DESTINATION_IMAGE_UPDATED",
        entityType: "DESTINATION",
        entityId: destinationId,
        metadata: {
          imageUrl: uploaded.url,
        },
      });

      await invalidateDestinationCache();

      return {
        destination,
        image: uploaded,
      };
    },

    listResource(actor, resource, query) {
      requireAdmin(actor);
      return repository.listResource(resource, query);
    },
  });
};

export const systemAdminService = createSystemAdminService();
export default systemAdminService;
