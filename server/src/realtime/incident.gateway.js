import { ROLES } from "../constants/roles.js";
import { incidentRepository } from "../modules/incident/incident.repository.js";
import { realtimeRooms } from "./realtimePublisher.js";

const STAFF = new Set([ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN]);
const isParticipant = (trip, userId) =>
  trip?.touristId === userId || Boolean(trip?.group?.members?.some((member) => member.userId === userId));

export const canAccessIncident = async (repository, actor, incidentId) => {
  if (!actor?.id || !actor?.role) return null;
  const incident = await repository.findById(incidentId);
  if (!incident) return null;
  if (STAFF.has(actor.role) || incident.userId === actor.id) return incident;
  if (actor.role !== ROLES.TOURIST) return null;
  const trip = await repository.findTripContext(incident.tripId, actor.id);
  return trip && isParticipant(trip, actor.id) ? incident : null;
};

export const registerIncidentGateway = (
  socket,
  { repository = incidentRepository, log } = {},
) => {
  socket.on("incident:subscribe", async (payload = {}, acknowledge = () => {}) => {
    try {
      if (!socket.data.user?.id) {
        acknowledge({ ok: false, code: "SOCKET_AUTH_REQUIRED" });
        return;
      }
      if (typeof payload.incidentId !== "string" || !payload.incidentId.trim()) {
        acknowledge({ ok: false, code: "INCIDENT_ID_REQUIRED" });
        return;
      }
      const incident = await canAccessIncident(repository, socket.data.user, payload.incidentId.trim());
      if (!incident) {
        acknowledge({ ok: false, code: "INCIDENT_SUBSCRIPTION_FORBIDDEN" });
        return;
      }
      await socket.join(realtimeRooms.incidentRoom(incident.id));
      acknowledge({ ok: true, incidentId: incident.id });
    } catch (error) {
      log?.warn?.({ err: error }, "Incident room subscription failed");
      acknowledge({ ok: false, code: "INCIDENT_SUBSCRIPTION_FAILED" });
    }
  });

  socket.on("incident:unsubscribe", async (payload = {}, acknowledge = () => {}) => {
    if (typeof payload.incidentId !== "string" || !payload.incidentId.trim()) {
      acknowledge({ ok: false, code: "INCIDENT_ID_REQUIRED" });
      return;
    }
    await socket.leave(realtimeRooms.incidentRoom(payload.incidentId.trim()));
    acknowledge({ ok: true, incidentId: payload.incidentId.trim() });
  });
};

export default registerIncidentGateway;
