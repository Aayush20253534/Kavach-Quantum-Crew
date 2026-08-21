import { jest } from "@jest/globals";
import { createObservabilityService } from "../../src/modules/observability/observability.service.js";

const admin = { id: "admin-1", role: "SYSTEM_ADMIN" };

describe("Phase 24 observability service", () => {
  test("returns metrics only to system admin", () => {
    const registry = { snapshot: jest.fn().mockReturnValue({ totalRequests: 9 }) };
    const service = createObservabilityService({ registry });
    expect(service.metrics(admin)).toEqual({ totalRequests: 9 });
    expect(() => service.metrics({ id: "dm-1", role: "DISASTER_MANAGER" })).toThrow(
      "Observability access requires system administrator privileges",
    );
  });

  test("returns healthy diagnostics when PostgreSQL responds", async () => {
    const registry = { snapshot: jest.fn().mockReturnValue({ totalRequests: 4 }) };
    const repository = { checkDatabase: jest.fn().mockResolvedValue({ latencyMs: 7 }) };
    const service = createObservabilityService({
      registry,
      repository,
      memoryUsage: () => ({ rss: 10, heapTotal: 8, heapUsed: 4, external: 2 }),
      uptime: () => 42.8,
      clock: () => new Date("2026-08-22T00:00:00.000Z"),
    });
    await expect(service.diagnostics(admin)).resolves.toEqual({
      status: "healthy",
      checkedAt: "2026-08-22T00:00:00.000Z",
      uptimeSeconds: 42,
      memory: { rssBytes: 10, heapTotalBytes: 8, heapUsedBytes: 4, externalBytes: 2 },
      database: { status: "up", latencyMs: 7 },
      metrics: { totalRequests: 4 },
    });
  });

  test("reports degraded diagnostics instead of leaking database errors", async () => {
    const registry = { snapshot: jest.fn().mockReturnValue({ totalRequests: 0 }) };
    const repository = { checkDatabase: jest.fn().mockRejectedValue(new Error("secret database detail")) };
    const service = createObservabilityService({
      registry,
      repository,
      memoryUsage: () => ({ rss: 1, heapTotal: 1, heapUsed: 1, external: 1 }),
      uptime: () => 1,
      clock: () => new Date("2026-08-22T00:00:00.000Z"),
    });
    const result = await service.diagnostics(admin);
    expect(result.status).toBe("degraded");
    expect(result.database).toEqual({ status: "down" });
    expect(JSON.stringify(result)).not.toContain("secret database detail");
  });
});
