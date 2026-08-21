import { jest } from "@jest/globals";

import { createHealthRepository } from "../../src/modules/health/health.repository.js";
import { createHealthService } from "../../src/modules/health/health.service.js";

const config = {
  APP_NAME: "safety-test",
  APP_VERSION: "1.2.3",
  NODE_ENV: "test",
};
const silentLogger = { warn: jest.fn() };

describe("health service", () => {
  test("health repository delegates the probe to the database boundary", async () => {
    const db = { ping: jest.fn().mockResolvedValue({ latencyMs: 3 }) };
    const repository = createHealthRepository({ db });

    await expect(repository.checkDatabase()).resolves.toEqual({ latencyMs: 3 });
    expect(db.ping).toHaveBeenCalledTimes(1);
  });

  test("reports process liveness without touching the database", () => {
    const repository = { checkDatabase: jest.fn() };
    const service = createHealthService({
      repository,
      config,
      log: silentLogger,
      uptime: () => 12.9,
    });

    expect(service.getLiveness()).toMatchObject({
      statusCode: 200,
      data: {
        status: "ok",
        service: "safety-test",
        version: "1.2.3",
        uptimeSeconds: 12,
      },
    });
    expect(repository.checkDatabase).not.toHaveBeenCalled();
  });

  test("reports readiness with database latency", async () => {
    const service = createHealthService({
      repository: {
        checkDatabase: jest.fn().mockResolvedValue({ latencyMs: 2.5 }),
      },
      config,
      log: silentLogger,
    });

    await expect(service.getReadiness()).resolves.toMatchObject({
      statusCode: 200,
      data: {
        status: "ready",
        checks: { database: { status: "up", latencyMs: 2.5 } },
      },
    });
  });

  test("returns a safe degraded result when PostgreSQL is unavailable", async () => {
    const service = createHealthService({
      repository: {
        checkDatabase: jest.fn().mockRejectedValue(new Error("secret host")),
      },
      config,
      log: silentLogger,
    });

    const result = await service.getDatabaseHealth();

    expect(result).toMatchObject({
      statusCode: 503,
      message: "Database is unreachable",
      data: { status: "down" },
    });
    expect(JSON.stringify(result)).not.toContain("secret host");
  });

  test("returns degraded readiness when PostgreSQL is unavailable", async () => {
    const service = createHealthService({
      repository: {
        checkDatabase: jest.fn().mockRejectedValue(new Error("offline")),
      },
      config,
      log: silentLogger,
    });

    await expect(service.getReadiness()).resolves.toMatchObject({
      statusCode: 503,
      data: {
        status: "not_ready",
        checks: { database: { status: "down" } },
      },
    });
  });

  test("reports direct database latency", async () => {
    const service = createHealthService({
      repository: {
        checkDatabase: jest.fn().mockResolvedValue({ latencyMs: 4 }),
      },
      config,
      log: silentLogger,
    });

    await expect(service.getDatabaseHealth()).resolves.toMatchObject({
      statusCode: 200,
      data: { status: "up", latencyMs: 4 },
    });
  });
});
