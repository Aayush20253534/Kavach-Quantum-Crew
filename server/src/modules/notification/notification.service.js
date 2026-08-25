import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { emergencyEmailService } from "../../integrations/notifications/emergency-email.service.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { notificationRepository } from "./notification.repository.js";

const payload = (targetAccountId, targetRole, incident, type, title, message, suffix = "") => ({
  targetAccountId,
  targetRole,
  incidentId: incident?.id ?? null,
  type,
  dedupeKey: `${incident?.id ?? "system"}:${targetRole}:${targetAccountId}:${type}:${incident?.escalationLevel ?? 0}:${suffix}`,
  title,
  message,
});

const publishCreated = async (repository, publisher, notifications) => {
  await repository.createMany(notifications);
  for (const notification of notifications) publisher.publishNotificationCreated(notification);
};

export const createNotificationService = ({
  repository = notificationRepository,
  publisher = realtimePublisher,
  emailer = emergencyEmailService,
  clock = () => new Date(),
} = {}) => ({
  async incidentCreated(incident) {
    const notifications = [
      payload(incident.userId, ROLES.TOURIST, incident, "INCIDENT_CREATED", incident.title, "An emergency incident has been opened for your trip."),
    ];
    const [managers, leaderId, tourist] = await Promise.all([
      repository.listDisasterManagers(),
      repository.findGroupLeader(incident.tripId),
      repository.findTourist(incident.userId),
    ]);

    for (const manager of managers) {
      notifications.push(payload(manager.id, ROLES.DISASTER_MANAGER, incident, "INCIDENT_CREATED", `New ${incident.severity.toLowerCase()} incident`, incident.title));
    }
    await emailer.incidentCreated({ recipients: managers, incident });

    if (leaderId && leaderId !== incident.userId) {
      notifications.push(payload(leaderId, ROLES.TOURIST, incident, "GROUP_MEMBER_EMERGENCY", "Group member safety alert", "A member of your active trip group has an emergency incident."));
    }

    if (incident.sourceType === "SAFETY_ALERT" && incident.severity === "DANGER" && incident.title?.startsWith("Entered risk zone:") && tourist) {
      await emailer.dangerZoneEntered({ recipient: tourist, incident });
    }

    await publishCreated(repository, publisher, notifications);
  },

  async signalLoss({ signalCase, trip, member, leader, reminder = false }) {
    const managers = await repository.listDisasterManagers();
    const suffix = `${signalCase.id}:${new Date(signalCase.lastNotifiedAt || signalCase.detectedAt).getTime()}`;
    const notifications = [];
    const title = reminder ? "Group member still offline" : "Group member signal lost";
    const message = `${member.name || "A group member"} has not sent a location update for at least 5 minutes. The leader has 5 minutes to mark false alarm or confirm danger.`;

    if (leader) {
      notifications.push(payload(leader.id, ROLES.TOURIST, null, "GROUP_MEMBER_EMERGENCY", title, message, suffix));
    }
    for (const manager of managers) {
      notifications.push(payload(manager.id, ROLES.DISASTER_MANAGER, null, "INCIDENT_ESCALATED", title, message, suffix));
    }

    await emailer.signalLossAlert({ recipients: [leader, ...managers].filter(Boolean), member, trip, signalCase, reminder });
    await publishCreated(repository, publisher, notifications);
  },

  async statusChanged(incident, type, message) {
    const notifications = [payload(incident.userId, ROLES.TOURIST, incident, type, incident.title, message)];
    if (incident.assignedToId && incident.assignedToRole) {
      notifications.push(payload(incident.assignedToId, incident.assignedToRole, incident, type, incident.title, message));
    }
    await publishCreated(repository, publisher, notifications);
  },

  async assigned(incident) {
    if (!incident.assignedToId || !incident.assignedToRole) return;
    const notifications = [
      payload(incident.assignedToId, incident.assignedToRole, incident, "INCIDENT_ASSIGNED", "Incident assigned", incident.title),
      payload(incident.userId, ROLES.TOURIST, incident, "INCIDENT_ASSIGNED", incident.title, "A responder has been assigned to your incident."),
    ];
    await publishCreated(repository, publisher, notifications);
  },

  async escalated(incident) {
    const managers = await repository.listDisasterManagers();
    const notifications = managers.map((manager) => payload(manager.id, ROLES.DISASTER_MANAGER, incident, "INCIDENT_ESCALATED", `Escalation level ${incident.escalationLevel}`, incident.title));
    await publishCreated(repository, publisher, notifications);
  },

  async list(actor, query) {
    try { return await repository.list(actor.id, actor.role, query); }
    catch (error) { console.error("Notification list query failed", error); return []; }
  },
  async unreadCount(actor) {
    try { return await repository.countUnread(actor.id, actor.role); }
    catch (error) { console.error("Notification unread-count query failed", error); return 0; }
  },
  async markRead(actor, id) {
    const notification = await repository.findOwned(id, actor.id, actor.role);
    if (!notification) throw ApiError.notFound("Notification not found", { code: "NOTIFICATION_NOT_FOUND" });
    if (notification.readAt) return notification;
    const updated = await repository.markRead(id, clock());
    publisher.publishNotificationRead(updated);
    return updated;
  },
  async markAllRead(actor) {
    const now = clock();
    const result = await repository.markAllRead(actor.id, actor.role, now);
    publisher.publishNotificationsReadAll(actor, now);
    return result;
  },
});

export const notificationService = createNotificationService();
export default notificationService;
