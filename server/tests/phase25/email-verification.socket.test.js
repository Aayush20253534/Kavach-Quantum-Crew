import { signAccessToken } from "../../src/common/utils/jwt.js";
import { environment } from "../../src/config/environment.js";
import { createSocketAuthenticator } from "../../src/realtime/socketAuth.middleware.js";

const run = (middleware, socket) =>
  new Promise((resolve) => {
    middleware(socket, (error) => {
      resolve(error);
    });
  });

describe("Email verification Socket.IO enforcement", () => {
  test("rejects an unverified tourist even with a valid access token", async () => {
    const db = {
      user: {
        findUnique: async () => ({
          id: "11111111-1111-1111-1111-111111111111",
          status: "ACTIVE",
          emailVerifiedAt: null,
        }),
      },
      disasterManager: { findUnique: async () => null },
      systemAdmin: { findUnique: async () => null },
    };
    const token = signAccessToken(
      {
        id: "11111111-1111-1111-1111-111111111111",
        role: "TOURIST",
      },
      environment,
    );
    const socket = {
      handshake: { auth: { token }, headers: {} },
      data: {},
    };

    const error = await run(createSocketAuthenticator({ db, config: environment }), socket);

    expect(error).toEqual(expect.any(Error));
    expect(error.message).toBe("SOCKET_EMAIL_UNVERIFIED");
    expect(socket.data.user).toBeUndefined();
  });
});
