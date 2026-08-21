let socketServer = null;

const accountRoom = (role, id) => `account:${role}:${id}`;
const incidentRoom = (id) => `incident:${id}`;
const roleRoom = (role) => `role:${role}`;

export const setRealtimeSocketServer = (io) => {
  socketServer = io ?? null;
};

const emitIncident = (eventName, incident, extra = {}) => {
  if (!socketServer || !incident?.id) return;
  const payload = { incident, ...extra };
  socketServer.to(incidentRoom(incident.id)).emit(eventName, payload);
  if (incident.userId) {
    socketServer.to(accountRoom("TOURIST", incident.userId)).emit(eventName, payload);
  }
  socketServer.to(roleRoom("DISASTER_MANAGER")).emit(eventName, payload);
  socketServer.to(roleRoom("SYSTEM_ADMIN")).emit(eventName, payload);
};

export const realtimePublisher = Object.freeze({
  publishIncidentCreated(incident) {
    emitIncident("incident:created", incident);
  },
  publishIncidentUpdated(incident, change = {}) {
    emitIncident("incident:updated", incident, { change });
  },
  publishIncidentNote(incident, note) {
    emitIncident("incident:note", incident, { note });
  },
  publishNotificationCreated(notification) {
    if (!socketServer || !notification?.targetAccountId || !notification?.targetRole) return;
    socketServer
      .to(accountRoom(notification.targetRole, notification.targetAccountId))
      .emit("notification:created", { notification });
  },
  publishNotificationRead(notification) {
    if (!socketServer || !notification?.targetAccountId || !notification?.targetRole) return;
    socketServer
      .to(accountRoom(notification.targetRole, notification.targetAccountId))
      .emit("notification:read", { notification });
  },
  publishNotificationsReadAll(actor, readAt) {
    if (!socketServer || !actor?.id || !actor?.role) return;
    socketServer
      .to(accountRoom(actor.role, actor.id))
      .emit("notification:read-all", { readAt });
  },
});

export const realtimeRooms = Object.freeze({ accountRoom, incidentRoom, roleRoom });
