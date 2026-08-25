import { prisma } from "../../config/database.js";

const accountSelect = { id: true, email: true, phone: true };

export const createNotificationDeliveryRepository = ({ db = prisma } = {}) => ({
  findNotification(id) {
    return db.notification.findUnique({ where: { id } });
  },

  async resolveRecipient(notification) {
    if (!notification) return null;

    if (notification.targetRole === "TOURIST") {
      return db.user.findUnique({
        where: { id: notification.targetAccountId },
        select: accountSelect,
      });
    }

    if (notification.targetRole === "DISASTER_MANAGER") {
      return db.disasterManager.findUnique({
        where: { id: notification.targetAccountId },
        select: accountSelect,
      });
    }

    if (notification.targetRole === "SYSTEM_ADMIN") {
      return db.systemAdmin.findUnique({
        where: { id: notification.targetAccountId },
        select: accountSelect,
      });
    }

    return null;
  },

  async createMany(notificationId, channels) {
    return Promise.all(
      channels.map((channel) =>
        db.notificationDelivery.upsert({
          where: { notificationId_channel: { notificationId, channel } },
          update: {},
          create: { notificationId, channel },
        }),
      ),
    );
  },

  findById(id) {
    return db.notificationDelivery.findUnique({
      where: { id },
      include: { notification: true, attempts: { orderBy: { attemptNumber: "asc" } } },
    });
  },

  list({ notificationId, channel, status, limit }) {
    return db.notificationDelivery.findMany({
      where: {
        ...(notificationId ? { notificationId } : {}),
        ...(channel ? { channel } : {}),
        ...(status ? { status } : {}),
      },
      include: { notification: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  findDue(now, limit) {
    return db.notificationDelivery.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "RETRY_SCHEDULED", nextAttemptAt: { lte: now } },
        ],
      },
      include: { notification: true },
      orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
      take: limit,
    });
  },

  markSending(id, attemptNumber) {
    return db.notificationDelivery.update({
      where: { id },
      data: { status: "SENDING", attemptsCount: attemptNumber, lastAttemptAt: new Date() },
    });
  },

  markSent(id, { provider, externalId, sentAt }) {
    return db.notificationDelivery.update({
      where: { id },
      data: {
        status: "SENT",
        provider,
        externalId,
        sentAt,
        nextAttemptAt: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
  },

  markFailure(id, { status, nextAttemptAt, code, message, failedAt }) {
    return db.notificationDelivery.update({
      where: { id },
      data: {
        status,
        nextAttemptAt,
        lastErrorCode: code,
        lastErrorMessage: message,
        failedAt: status === "FAILED" ? failedAt : null,
      },
    });
  },

  resetForRetry(id) {
    return db.notificationDelivery.update({
      where: { id },
      data: {
        status: "PENDING",
        nextAttemptAt: null,
        failedAt: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });
  },

  createAttempt(data) {
    return db.notificationDeliveryAttempt.create({ data });
  },

  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({
      data: {
        actorId,
        actorRole,
        action,
        entityType: "NotificationDelivery",
        entityId,
        metadata,
      },
    });
  },
});

export const notificationDeliveryRepository = createNotificationDeliveryRepository();

export default notificationDeliveryRepository;
