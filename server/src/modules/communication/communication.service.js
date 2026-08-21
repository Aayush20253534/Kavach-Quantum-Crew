import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { communicationRepository } from "./communication.repository.js";

const STAFF = new Set([ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN]);
const CLOSED = new Set(["RESOLVED", "DISMISSED"]);

const isParticipant = (trip, userId) =>
  trip?.touristId === userId || Boolean(trip?.group?.members?.some((member) => member.userId === userId));

export const createCommunicationService = ({
  repository = communicationRepository,
  publisher = realtimePublisher,
} = {}) => {
  const getVisibleIncident = async (actor, incidentId) => {
    const incident = await repository.findIncident(incidentId);
    if (!incident) {
      throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" });
    }

    if (STAFF.has(actor.role) || incident.userId === actor.id) return incident;

    if (actor.role === ROLES.TOURIST) {
      const trip = await repository.findTripContext(incident.tripId, actor.id);
      if (trip && isParticipant(trip, actor.id)) return incident;
    }

    throw ApiError.notFound("Incident not found", { code: "INCIDENT_NOT_FOUND" });
  };

  return Object.freeze({
    async list(actor, incidentId, query) {
      await getVisibleIncident(actor, incidentId);
      const rows = await repository.listMessages(incidentId, query);
      const oldest = rows.at(-1);

      return {
        items: [...rows].reverse(),
        nextBefore: rows.length === query.limit && oldest ? oldest.createdAt : null,
      };
    },

    async send(actor, incidentId, input) {
      const incident = await getVisibleIncident(actor, incidentId);
      if (CLOSED.has(incident.status)) {
        throw ApiError.conflict("Closed incidents cannot receive new messages", {
          code: "INCIDENT_COMMUNICATION_CLOSED",
        });
      }

      const message = await repository.createMessage(incidentId, actor, input.message);
      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "INCIDENT_MESSAGE_SENT",
        entityId: message.id,
        metadata: { incidentId },
      });

      publisher.publishIncidentMessage?.(incident, message);
      return message;
    },
  });
};

export const communicationService = createCommunicationService();

export default communicationService;
