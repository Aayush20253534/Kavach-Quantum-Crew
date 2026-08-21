import { createServer as createNodeServer } from "node:http";
import { jest } from "@jest/globals";

import { environment } from "../../src/config/environment.js";
import { getActiveRuntime, startServer, stopServer } from "../../src/server.js";
import { createTestApp } from "../helpers/createTestApp.js";

describe("HTTP server lifecycle", () => {
  afterEach(async () => {
    if (getActiveRuntime()) await stopServer({ reason: "test-cleanup" });
  });

  test("starts on an ephemeral port and shuts down all infrastructure", async () => {
    const db = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const io = { close: jest.fn((callback) => callback()) };
    const socketFactory = jest.fn(() => io);
    const log = { info: jest.fn(), error: jest.fn() };

    const runtime = await startServer({
      application: createTestApp(),
      db,
      config: environment,
      socketFactory,
      host: "127.0.0.1",
      port: 0,
      log,
    });

    const response = await fetch(`http://127.0.0.1:${runtime.port}/health`);
    expect(response.status).toBe(200);
    expect(db.connect).toHaveBeenCalledTimes(1);
    expect(socketFactory).toHaveBeenCalledTimes(1);

    await stopServer({ reason: "test", log });

    expect(io.close).toHaveBeenCalledTimes(1);
    expect(db.disconnect).toHaveBeenCalledTimes(1);
    expect(getActiveRuntime()).toBeNull();
  });

  test("can run with Socket.IO disabled", async () => {
    const db = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const socketFactory = jest.fn();
    const log = { info: jest.fn(), error: jest.fn() };

    const runtime = await startServer({
      application: createTestApp(),
      db,
      config: { ...environment, SOCKET_IO_ENABLED: false },
      socketFactory,
      host: "127.0.0.1",
      port: 0,
      log,
    });

    expect(runtime.io).toBeNull();
    expect(socketFactory).not.toHaveBeenCalled();
    await stopServer({ reason: "socket-disabled-test", log });
  });

  test("cleans up the database and socket layer when the port is unavailable", async () => {
    const occupiedServer = createNodeServer();
    await new Promise((resolve) => {
      occupiedServer.listen(0, "127.0.0.1", resolve);
    });
    const occupiedAddress = occupiedServer.address();
    const db = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const io = { close: jest.fn((callback) => callback()) };

    await expect(
      startServer({
        application: createTestApp(),
        db,
        config: environment,
        socketFactory: () => io,
        host: "127.0.0.1",
        port: occupiedAddress.port,
        log: { info: jest.fn(), error: jest.fn() },
      }),
    ).rejects.toMatchObject({ code: "EADDRINUSE" });

    expect(io.close).toHaveBeenCalledTimes(1);
    expect(db.disconnect).toHaveBeenCalledTimes(1);
    await new Promise((resolve, reject) => {
      occupiedServer.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test("surfaces a failed shutdown task and force-closes remaining connections", async () => {
    const db = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const io = {
      close: jest.fn((callback) => callback(new Error("socket close failed"))),
    };
    const log = { info: jest.fn(), error: jest.fn() };

    await startServer({
      application: createTestApp(),
      db,
      config: environment,
      socketFactory: () => io,
      host: "127.0.0.1",
      port: 0,
      log,
    });

    await expect(stopServer({ reason: "failure-test", log })).rejects.toThrow(
      "shutdown tasks failed",
    );
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(getActiveRuntime()).toBeNull();
  });
});
