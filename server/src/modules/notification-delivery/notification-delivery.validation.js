import { z } from "zod";

const uuid = z.string().uuid();
export const DELIVERY_CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH", "WHATSAPP"];
export const DELIVERY_STATUSES = ["PENDING", "SENDING", "SENT", "FAILED", "RETRY_SCHEDULED"];

export const notificationDeliveryParamsSchema = z.object({ deliveryId: uuid });
export const notificationDeliveryNotificationParamsSchema = z.object({ notificationId: uuid });

export const enqueueNotificationDeliveryBodySchema = z.object({
  channels: z.array(z.enum(DELIVERY_CHANNELS)).min(1).max(5).transform((values) => [...new Set(values)]),
});

export const notificationDeliveryListQuerySchema = z.object({
  notificationId: uuid.optional(),
  channel: z.enum(DELIVERY_CHANNELS).optional(),
  status: z.enum(DELIVERY_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const processNotificationDeliveriesBodySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
