import { jest } from "@jest/globals";

import { createNotificationDeliveryService } from "../../src/modules/notification-delivery/notification-delivery.service.js";

const admin = { id: "123e4567-e89b-12d3-a456-426614174000", role: "SYSTEM_ADMIN" };
const manager = { id: "123e4567-e89b-12d3-a456-426614174001", role: "DISASTER_MANAGER" };
const notification = {
  id: "123e4567-e89b-12d3-a456-426614174010",
  targetAccountId: "123e4567-e89b-12d3-a456-426614174011",
  targetRole: "TOURIST",
  type: "INCIDENT_CREATED",
  title: "Emergency",
  message: "Incident created",
};

const delivery = {
  id: "123e4567-e89b-12d3-a456-426614174020",
  notificationId: notification.id,
  channel: "EMAIL",
  status: "PENDING",
  attemptsCount: 0,
  notification,
};

describe("Phase 22 notification delivery service", () => {
  test("enqueues unique delivery channels for an existing notification", async () => {
    const repository = {
      findNotification: jest.fn().mockResolvedValue(notification),
      createMany: jest.fn().mockResolvedValue([{ ...delivery }]),
      createAudit: jest.fn().mockResolvedValue({}),
    };
    const service = createNotificationDeliveryService({ repository });

    await expect(service.enqueue(manager, notification.id, { channels: ["EMAIL"] })).resolves.toHaveLength(1);
    expect(repository.createMany).toHaveBeenCalledWith(notification.id, ["EMAIL"]);
  });

  test("rejects tourist access", () => {
    const service = createNotificationDeliveryService({ repository: {} });
    expect(() => service.capabilities({ id: "t-1", role: "TOURIST" })).toThrow(
      "Notification delivery access requires emergency staff",
    );
  });

  test("sends a due delivery and records a successful attempt", async () => {
    const repository = {
      findDue: jest.fn().mockResolvedValue([delivery]),
      resolveRecipient: jest.fn().mockResolvedValue({ id: notification.targetAccountId, email: "tourist@example.com", phone: "+911234567890" }),
      markSending: jest.fn().mockResolvedValue({}),
      createAttempt: jest.fn().mockResolvedValue({}),
      markSent: jest.fn().mockImplementation(async (id, data) => ({ id, status: "SENT", ...data })),
    };
    const provider = {
      send: jest.fn().mockResolvedValue({ provider: "SMTP", externalId: "mail-1" }),
      capabilities: jest.fn(),
    };
    const clock = () => new Date("2026-08-22T00:00:00.000Z");
    const service = createNotificationDeliveryService({ repository, provider, clock });

    const result = await service.processDue(admin, { limit: 10 });
    expect(result.processed).toBe(1);
    expect(result.deliveries[0]).toMatchObject({ status: "SENT", provider: "SMTP" });
    expect(provider.send).toHaveBeenCalledWith("EMAIL", expect.objectContaining({ destination: "tourist@example.com" }));
  });

  test("schedules a retry for a retryable provider failure", async () => {
    const error = Object.assign(new Error("temporary outage"), { code: "PROVIDER_TIMEOUT", retryable: true });
    const repository = {
      findDue: jest.fn().mockResolvedValue([delivery]),
      resolveRecipient: jest.fn().mockResolvedValue({ id: notification.targetAccountId, email: "tourist@example.com" }),
      markSending: jest.fn().mockResolvedValue({}),
      createAttempt: jest.fn().mockResolvedValue({}),
      markFailure: jest.fn().mockImplementation(async (id, data) => ({ id, ...data })),
    };
    const provider = { send: jest.fn().mockRejectedValue(error), capabilities: jest.fn() };
    const clock = () => new Date("2026-08-22T00:00:00.000Z");
    const service = createNotificationDeliveryService({ repository, provider, clock });

    const result = await service.processDue(admin, { limit: 10 });
    expect(result.deliveries[0].status).toBe("RETRY_SCHEDULED");
    expect(result.deliveries[0].nextAttemptAt).toEqual(new Date("2026-08-22T00:01:00.000Z"));
  });

  test("only system admin can process the delivery queue", async () => {
    const repository = { findDue: jest.fn() };
    const service = createNotificationDeliveryService({ repository });
    await expect(service.processDue(manager, { limit: 10 })).rejects.toMatchObject({
      statusCode: 403,
      code: "NOTIFICATION_DELIVERY_PROCESS_FORBIDDEN",
    });
    expect(repository.findDue).not.toHaveBeenCalled();
  });
});
