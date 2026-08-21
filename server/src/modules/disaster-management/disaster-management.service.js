import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { incidentService } from "../incident/incident.service.js";
import { disasterManagementRepository } from "./disaster-management.repository.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";

export const createDisasterManagementService = ({
  repository = disasterManagementRepository,
  incidents = incidentService,
  publisher = realtimePublisher,
  clock = () => new Date(),
} = {}) => {
  const requireResponder = async (id) => {
    const responder = await repository.findResponderById(id);
    if (!responder || responder.status !== "ACTIVE") {
      throw ApiError.notFound("Responder not found", { code: "RESPONDER_NOT_FOUND" });
    }
    return responder;
  };

  return Object.freeze({
    async dashboard(actor) {
      return repository.dashboard(actor.role === ROLES.DISASTER_MANAGER ? actor.id : null);
    },

    async me(actor) {
      if (actor.role !== ROLES.DISASTER_MANAGER) {
        throw ApiError.forbidden("Responder profile is only available to disaster managers", { code: "RESPONDER_PROFILE_FORBIDDEN" });
      }
      const responder = await requireResponder(actor.id);
      const activeIncidentCount = await repository.countActiveAssignments(actor.id);
      return { ...responder, activeIncidentCount, atCapacity: activeIncidentCount >= responder.maxActiveIncidents };
    },

    listResponders(_actor, query) {
      return repository.listResponders(query);
    },

    async getResponder(_actor, responderId) {
      const responder = await requireResponder(responderId);
      const activeIncidentCount = await repository.countActiveAssignments(responderId);
      return { ...responder, activeIncidentCount, atCapacity: activeIncidentCount >= responder.maxActiveIncidents };
    },

    async updateMyStatus(actor, status) {
      if (actor.role !== ROLES.DISASTER_MANAGER) {
        throw ApiError.forbidden("Only disaster managers can update responder availability", { code: "RESPONDER_STATUS_FORBIDDEN" });
      }
      await requireResponder(actor.id);
      const updated = await repository.updateResponderStatus(actor.id, status, clock());
      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "RESPONDER_STATUS_CHANGED",
        entityId: actor.id,
        metadata: { responderStatus: status },
      });
      publisher.publishResponderStatus(updated);
      return updated;
    },

    myIncidents(actor, query) {
      if (actor.role !== ROLES.DISASTER_MANAGER) {
        throw ApiError.forbidden("Only disaster managers have personal assignments", { code: "RESPONDER_ASSIGNMENTS_FORBIDDEN" });
      }
      return repository.listAssignedIncidents(actor.id, query);
    },

    queue(actor, query) {
      if (query.scope === "MINE" && actor.role !== ROLES.DISASTER_MANAGER) {
        throw ApiError.badRequest("MINE scope requires a disaster manager account", { code: "INCIDENT_SCOPE_INVALID" });
      }
      return repository.listIncidentQueue({ ...query, actorId: actor.id });
    },

    get: (actor, id) => incidents.get(actor, id),
    acknowledge: (actor, id, note) => incidents.acknowledge(actor, id, note),
    start: (actor, id, note) => incidents.startResponse(actor, id, note),
    resolve: (actor, id, note) => incidents.resolve(actor, id, note),
  });
};

export const disasterManagementService = createDisasterManagementService();
export default disasterManagementService;
