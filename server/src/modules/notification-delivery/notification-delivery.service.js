import { ApiError } from "../../common/errors/ApiError.js";

import { notificationDeliveryProvider } from "./notification-delivery.provider.js";
import { notificationDeliveryRepository } from "./notification-delivery.repository.js";

const STAFF = new Set(["DISASTER_MANAGER", "SYSTEM_ADMIN"]);
const MAX_ATTEMPTS = 3;
const BASE_RETRY_MS = 60_000;

const requireStaff = (actor) => {
  if (!STAFF.has(actor.role)) {
    throw ApiError.forbidden(
      "Notification delivery access requires emergency staff",
      { code: "NOTIFICATION_DELIVERY_FORBIDDEN" },
    );
  }
};

const destinationFor = (channel, recipient) => {
  if (channel === "IN_APP") return recipient?.id ?? null;
  if (channel === "EMAIL") return recipient?.email ?? null;
  if (channel === "SMS" || channel === "WHATSAPP") return recipient?.phone ?? null;
  return null;
};

const retryAt = (clock, attemptNumber) =>
  new Date(clock().getTime() + BASE_RETRY_MS * 2 ** Math.max(0, attemptNumber - 1));

export const createNotificationDeliveryService = ({
  repository = notificationDeliveryRepository,
  provider = notificationDeliveryProvider,
  clock = () => new Date(),
} = {}) => {
  const deliverOne = async (delivery) => {
    if (!delivery) {
      throw ApiError.notFound("Notification delivery not found", {
        code: "NOTIFICATION_DELIVERY_NOT_FOUND",
      });
    }

    if (delivery.status === "SENT") return delivery;

    const recipient = await repository.resolveRecipient(delivery.notification);
    const destination = destinationFor(delivery.channel, recipient);
    const attemptNumber = (delivery.attemptsCount ?? 0) + 1;
    const attemptedAt = clock();

    await repository.markSending(delivery.id, attemptNumber);

    if (!destination) {
      const code = "DELIVERY_DESTINATION_UNAVAILABLE";
      const message = `No destination is available for ${delivery.channel}`;
      await repository.createAttempt({
        deliveryId: delivery.id,
        attemptNumber,
        status: "FAILED",
        provider: null,
        errorCode: code,
        errorMessage: message,
        attemptedAt,
      });
      return repository.markFailure(delivery.id, {
        status: "FAILED",
        nextAttemptAt: null,
        code,
        message,
        failedAt: attemptedAt,
      });
    }

    try {
      const result = await provider.send(delivery.channel, {
        destination,
        notification: {
          id: delivery.notification.id,
          type: delivery.notification.type,
          title: delivery.notification.title,
          message: delivery.notification.message,
        },
      });

      await repository.createAttempt({
        deliveryId: delivery.id,
        attemptNumber,
        status: "SENT",
        provider: result?.provider ?? null,
        externalId: result?.externalId ?? null,
        attemptedAt,
      });

      return repository.markSent(delivery.id, {
        provider: result?.provider ?? null,
        externalId: result?.externalId ?? null,
        sentAt: attemptedAt,
      });
    } catch (error) {
      const retryable = error?.retryable === true && attemptNumber < MAX_ATTEMPTS;
      const status = retryable ? "RETRY_SCHEDULED" : "FAILED";
      const nextAttemptAt = retryable ? retryAt(clock, attemptNumber) : null;
      const code = error?.code ?? "DELIVERY_PROVIDER_ERROR";
      const message = error?.message ?? "Notification delivery failed";

      await repository.createAttempt({
        deliveryId: delivery.id,
        attemptNumber,
        status,
        provider: null,
        errorCode: code,
        errorMessage: message,
        attemptedAt,
      });

      return repository.markFailure(delivery.id, {
        status,
        nextAttemptAt,
        code,
        message,
        failedAt: attemptedAt,
      });
    }
  };

  return Object.freeze({
    capabilities(actor) {
      requireStaff(actor);
      return provider.capabilities();
    },

    async enqueue(actor, notificationId, { channels }) {
      requireStaff(actor);
      const notification = await repository.findNotification(notificationId);
      if (!notification) {
        throw ApiError.notFound("Notification not found", { code: "NOTIFICATION_NOT_FOUND" });
      }

      const deliveries = await repository.createMany(notificationId, channels);
      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "NOTIFICATION_DELIVERY_ENQUEUED",
        entityId: notificationId,
        metadata: { channels },
      });
      return deliveries;
    },

    list(actor, query) {
      requireStaff(actor);
      return repository.list(query);
    },

    async get(actor, deliveryId) {
      requireStaff(actor);
      const delivery = await repository.findById(deliveryId);
      if (!delivery) {
        throw ApiError.notFound("Notification delivery not found", {
          code: "NOTIFICATION_DELIVERY_NOT_FOUND",
        });
      }
      return delivery;
    },

    async retry(actor, deliveryId) {
      requireStaff(actor);
      const delivery = await repository.findById(deliveryId);
      if (!delivery) {
        throw ApiError.notFound("Notification delivery not found", {
          code: "NOTIFICATION_DELIVERY_NOT_FOUND",
        });
      }
      if (delivery.status === "SENT" || delivery.status === "SENDING") {
        throw ApiError.conflict("Delivery cannot be retried in its current state", {
          code: "NOTIFICATION_DELIVERY_RETRY_INVALID",
        });
      }
      return repository.resetForRetry(deliveryId);
    },

    async processDue(actor, { limit }) {
      requireStaff(actor);
      if (actor.role !== "SYSTEM_ADMIN") {
        throw ApiError.forbidden("Only system administrators can process delivery jobs", {
          code: "NOTIFICATION_DELIVERY_PROCESS_FORBIDDEN",
        });
      }

      const due = await repository.findDue(clock(), limit);
      const results = [];
      for (const delivery of due) results.push(await deliverOne(delivery));
      return { processed: results.length, deliveries: results };
    },

    deliverOne,
  });
};

export const notificationDeliveryService = createNotificationDeliveryService();

export default notificationDeliveryService;
