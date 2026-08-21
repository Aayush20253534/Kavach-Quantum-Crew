import { jest } from "@jest/globals";
import { createAuditLogMiddleware } from "../../src/middleware/auditLog.middleware.js";

describe("Phase 24 audit middleware", () => {
  test("records request correlation metadata", async () => {
    const service = { record: jest.fn().mockResolvedValue({}) };
    const middlewareFactory = createAuditLogMiddleware({ service });
    const middleware = middlewareFactory({ action: "TEST_ACTION", entityType: "Trip", entityId: (req) => req.params.id });
    const next = jest.fn();
    await middleware({
      id: "request-1",
      user: { id: "admin-1", role: "SYSTEM_ADMIN" },
      params: { id: "trip-1" },
      method: "PATCH",
      originalUrl: "/api/v1/trips/trip-1",
      ip: "127.0.0.1",
    }, {}, next);
    expect(service.record).toHaveBeenCalledWith(expect.objectContaining({
      actorId: "admin-1",
      actorRole: "SYSTEM_ADMIN",
      action: "TEST_ACTION",
      entityType: "Trip",
      entityId: "trip-1",
      metadata: expect.objectContaining({ requestId: "request-1" }),
    }));
    expect(next).toHaveBeenCalledTimes(1);
  });
});
