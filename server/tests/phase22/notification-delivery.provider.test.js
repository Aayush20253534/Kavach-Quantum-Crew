import { jest } from "@jest/globals";

import {
  createNotificationDeliveryProvider,
} from "../../src/modules/notification-delivery/notification-delivery.provider.js";

describe("Phase 22 notification delivery provider", () => {
  test("delivers in-app notifications without an external provider", async () => {
    const provider = createNotificationDeliveryProvider();
    await expect(provider.send("IN_APP", {})).resolves.toEqual({ provider: "IN_APP", externalId: null });
  });

  test("fails closed when an external provider is not configured", async () => {
    const provider = createNotificationDeliveryProvider();
    await expect(provider.send("EMAIL", {})).rejects.toMatchObject({
      code: "DELIVERY_PROVIDER_NOT_CONFIGURED",
      retryable: false,
    });
  });

  test("delegates to an injected channel handler", async () => {
    const email = jest.fn().mockResolvedValue({ provider: "SMTP", externalId: "msg-1" });
    const provider = createNotificationDeliveryProvider({ handlers: { EMAIL: email } });
    await expect(provider.send("EMAIL", { destination: "a@example.com" })).resolves.toEqual({
      provider: "SMTP",
      externalId: "msg-1",
    });
    expect(email).toHaveBeenCalled();
  });
});
