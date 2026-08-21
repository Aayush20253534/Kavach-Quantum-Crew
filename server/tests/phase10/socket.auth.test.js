import { jest } from "@jest/globals";

import { signAccessToken } from "../../src/common/utils/jwt.js";
import { environment } from "../../src/config/environment.js";
import { createSocketAuthenticator } from "../../src/realtime/socketAuth.middleware.js";

const runAuth = (middleware, socket) =>
  new Promise((resolve) => middleware(socket, (error) => resolve(error)));

describe("Phase 10 socket authentication", () => {
  test("authenticates an active disaster manager", async () => {
    const db = {
      disasterManager: {
        findUnique: jest.fn().mockResolvedValue({ id: "dm-1", status: "ACTIVE" }),
      },
      user: { findUnique: jest.fn() },
      systemAdmin: { findUnique: jest.fn() },
    };
    const token = signAccessToken({ id: "dm-1", role: "DISASTER_MANAGER" }, environment);
    const socket = { handshake: { auth: { token }, headers: {} }, data: {} };

    const error = await runAuth(createSocketAuthenticator({ db, config: environment }), socket);

    expect(error).toBeUndefined();
    expect(socket.data.user).toEqual({ id: "dm-1", role: "DISASTER_MANAGER" });
    expect(db.disasterManager.findUnique).toHaveBeenCalled();
  });

  test("rejects inactive system accounts", async () => {
    const db = {
      systemAdmin: {
        findUnique: jest.fn().mockResolvedValue({ id: "admin-1", status: "DISABLED" }),
      },
      user: { findUnique: jest.fn() },
      disasterManager: { findUnique: jest.fn() },
    };
    const token = signAccessToken({ id: "admin-1", role: "SYSTEM_ADMIN" }, environment);
    const socket = { handshake: { auth: { token }, headers: {} }, data: {} };

    const error = await runAuth(createSocketAuthenticator({ db, config: environment }), socket);

    expect(error).toEqual(expect.any(Error));
    expect(error.message).toBe("SOCKET_ACCOUNT_INACTIVE");
  });
});
