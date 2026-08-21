import { createServer } from "node:http";
import { jest } from "@jest/globals";
import { io as createSocketClient } from "socket.io-client";

import { environment } from "../../src/config/environment.js";
import { createSocketServer } from "../../src/realtime/socketServer.js";

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
const closeHttp = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

describe("Socket.IO foundation", () => {
  test("accepts a connection and exposes only the Phase 0 ready event", async () => {
    const httpServer = createServer();
    const log = {
      child: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };
    log.child.mockReturnValue(log);

    const socketServer = createSocketServer(httpServer, {
      config: environment,
      log,
    });
    await listen(httpServer);
    const address = httpServer.address();
    const client = createSocketClient(`http://127.0.0.1:${address.port}`, {
      transports: ["websocket"],
      forceNew: true,
    });

    const payload = await new Promise((resolve, reject) => {
      client.once("system:ready", resolve);
      client.once("connect_error", reject);
    });

    expect(payload).toMatchObject({
      service: environment.APP_NAME,
      version: environment.APP_VERSION,
    });
    expect(payload.connectedAt).toEqual(expect.any(String));

    client.disconnect();
    await new Promise((resolve) => {
      socketServer.close(resolve);
    });
    if (httpServer.listening) await closeHttp(httpServer);
  });
});
