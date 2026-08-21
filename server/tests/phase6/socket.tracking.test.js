import { createServer } from "node:http";
import { jest } from "@jest/globals";
import { io as createSocketClient } from "socket.io-client";

import { environment } from "../../src/config/environment.js";
import { locationPublisher } from "../../src/realtime/locationPublisher.js";
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

describe("Phase 6 realtime tracking", () => {
  test("authorizes a tracking room before delivering location updates", async () => {
    const httpServer = createServer();

    const log = {
      child: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    log.child.mockReturnValue(log);

    const trackingRepo = {
      canSubscribeToTrip: jest.fn().mockResolvedValue({
        tripId: "trip-1",
        groupId: "group-1",
      }),
    };

    const authenticator = (socket, next) => {
      socket.data.user = {
        id: "user-1",
        role: "TOURIST",
      };

      next();
    };

    const io = createSocketServer(httpServer, {
      config: environment,
      log,
      authenticator,
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

    await new Promise((resolve, reject) => {
      client.once("system:ready", resolve);
      client.once("connect_error", reject);
    });

    const subscribed = await new Promise((resolve) => {
      client.emit(
        "tracking:subscribe",
        { tripId: "trip-1" },
        resolve,
      );
    });

    expect(subscribed).toEqual({
      ok: true,
      tripId: "trip-1",
      groupId: "group-1",
    });

    const received = new Promise((resolve) => {
      client.once("location:updated", resolve);
    });

    locationPublisher.publishLocationUpdated({
      tripId: "trip-1",
      groupId: "group-1",
      userId: "user-2",
      location: {
        latitude: 25.4,
        longitude: 81.8,
        accuracyM: 10,
      },
    });

    await expect(received).resolves.toMatchObject({
      tripId: "trip-1",
      userId: "user-2",
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