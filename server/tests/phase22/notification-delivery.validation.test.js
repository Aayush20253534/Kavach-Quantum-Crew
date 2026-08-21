import {
  enqueueNotificationDeliveryBodySchema,
  notificationDeliveryListQuerySchema,
  processNotificationDeliveriesBodySchema,
} from "../../src/modules/notification-delivery/notification-delivery.validation.js";

describe("Phase 22 notification delivery validation", () => {
  test("accepts and deduplicates delivery channels", () => {
    expect(enqueueNotificationDeliveryBodySchema.parse({ channels: ["EMAIL", "EMAIL", "SMS"] })).toEqual({
      channels: ["EMAIL", "SMS"],
    });
  });

  test("rejects unsupported delivery channels", () => {
    expect(enqueueNotificationDeliveryBodySchema.safeParse({ channels: ["FAX"] }).success).toBe(false);
  });

  test("caps delivery list size", () => {
    expect(notificationDeliveryListQuerySchema.parse({ limit: "100" }).limit).toBe(100);
    expect(notificationDeliveryListQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });

  test("defaults queue processing batch size", () => {
    expect(processNotificationDeliveriesBodySchema.parse({}).limit).toBe(25);
  });
});
