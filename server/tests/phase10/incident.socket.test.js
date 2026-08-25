import { createServer } from "node:http";

import { jest } from "@jest/globals";

import { io as createSocketClient } from "socket.io-client";

import { environment } from "../../src/config/environment.js";

import { realtimePublisher } from "../../src/realtime/realtimePublisher.js";

import { createSocketServer } from "../../src/realtime/socketServer.js";

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

const closeHttp = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

describe("Phase 10 incident realtime gateway", () => {
  test("authorizes a disaster manager subscription and streams incident updates", async () => {
    const httpServer = createServer();

    const log = {
      child: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    log.child.mockReturnValue(log);

    const authenticator = (socket, next) => {
      socket.data.user = {
        id: "dm-1",
        role: "DISASTER_MANAGER",
      };

      next();
    };

    const incidentRepo = {
      findById: jest.fn().mockResolvedValue({
        id: "inc-1",
        tripId: "trip-1",
        userId: "tourist-1",
      }),
      findTripContext: jest.fn(),
    };

    const trackingRepo = {
      canSubscribeToTrip: jest.fn(),
    };

    const io = createSocketServer(httpServer, {
      config: environment,
      log,
      authenticator,
      incidentRepo,
      trackingRepo,
    });

    await listen(httpServer);

    const address = httpServer.address();

    const client = createSocketClient(
      `http://127.0.0.1:${address.port}`,
      {
        transports: ["websocket"],
        forceNew: true,
      },
    );

    const ready = await new Promise((resolve, reject) => {
      client.once("system:ready", resolve);
      client.once("connect_error", reject);
    });

    expect(ready.actor).toEqual({
      id: "dm-1",
      role: "DISASTER_MANAGER",
    });

    const subscribed = await new Promise((resolve) => {
      client.emit(
        "incident:subscribe",
        { incidentId: "inc-1" },
        resolve,
      );
    });

    expect(subscribed).toEqual({
      ok: true,
      incidentId: "inc-1",
    });

    const received = new Promise((resolve) => {
      client.once("incident:updated", resolve);
    });

    realtimePublisher.publishIncidentUpdated(
      {
        id: "inc-1",
        userId: "tourist-1",
        status: "IN_PROGRESS",
      },
      {
        type: "RESPONSE_STARTED",
      },
    );

    await expect(received).resolves.toMatchObject({
      incident: {
        id: "inc-1",
        status: "IN_PROGRESS",
      },
      change: {
        type: "RESPONSE_STARTED",
      },
    });

    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });

    if (httpServer.listening) {
      await closeHttp(httpServer);
    }
  });

  test("refuses an unrelated tourist incident subscription", async () => {
    const httpServer = createServer();

    const log = {
      child: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    log.child.mockReturnValue(log);

    const authenticator = (socket, next) => {
      socket.data.user = {
        id: "tourist-2",
        role: "TOURIST",
      };

      next();
    };

    const incidentRepo = {
      findById: jest.fn().mockResolvedValue({
        id: "inc-1",
        tripId: "trip-1",
        userId: "tourist-1",
      }),
      findTripContext: jest.fn().mockResolvedValue(null),
    };

    const io = createSocketServer(httpServer, {
      config: environment,
      log,
      authenticator,
      incidentRepo,
      trackingRepo: {
        canSubscribeToTrip: jest.fn(),
      },
    });

    await listen(httpServer);

    const address = httpServer.address();

    const client = createSocketClient(
      `http://127.0.0.1:${address.port}`,
      {
        transports: ["websocket"],
        forceNew: true,
      },
    );

    await new Promise((resolve, reject) => {
      client.once("system:ready", resolve);
      client.once("connect_error", reject);
    });

    const result = await new Promise((resolve) => {
      client.emit(
        "incident:subscribe",
        { incidentId: "inc-1" },
        resolve,
      );
    });

    expect(result).toEqual({
      ok: false,
      code: "INCIDENT_SUBSCRIPTION_FORBIDDEN",
    });

    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });

    if (httpServer.listening) {
      await closeHttp(httpServer);
    }
  });
});