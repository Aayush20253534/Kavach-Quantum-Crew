import { jest } from "@jest/globals";

import { createDatabase } from "../../src/config/database.js";

describe("database lifecycle", () => {
  test("connects once, probes PostgreSQL, and disconnects cleanly", async () => {
    const client = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ result: 1 }]),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const log = { info: jest.fn() };
    const db = createDatabase({ client, log });

    await db.connect();
    await db.connect();
    const probe = await db.ping();

    expect(client.$connect).toHaveBeenCalledTimes(1);
    expect(client.$queryRawUnsafe).toHaveBeenCalledWith("SELECT 1");
    expect(probe.latencyMs).toBeGreaterThanOrEqual(0);
    expect(db.isConnected).toBe(true);

    await db.disconnect();
    expect(client.$disconnect).toHaveBeenCalledTimes(1);
    expect(db.isConnected).toBe(false);
  });

  test("clears connection state even when disconnect fails", async () => {
    const client = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: jest.fn(),
      $disconnect: jest.fn().mockRejectedValue(new Error("disconnect failed")),
    };
    const db = createDatabase({ client, log: { info: jest.fn() } });

    await db.connect();
    await expect(db.disconnect()).rejects.toThrow("disconnect failed");
    expect(db.isConnected).toBe(false);
  });
});
