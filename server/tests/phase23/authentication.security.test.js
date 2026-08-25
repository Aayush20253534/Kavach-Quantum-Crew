import jwt from "jsonwebtoken";

import { jest } from "@jest/globals";

import { createAuthenticate } from "../../src/middleware/authenticate.middleware.js";

import { environment } from "../../src/config/environment.js";

const run = (middleware, request) =>
  new Promise((resolve) => {
    middleware(request, {}, (error) => {
      resolve(error);
    });
  });

describe("Phase 23 authentication hardening", () => {
  test("rejects tokens containing an unknown role before database lookup", async () => {
    const db = {
      user: {
        findUnique: jest.fn(),
      },
      disasterManager: {
        findUnique: jest.fn(),
      },
      systemAdmin: {
        findUnique: jest.fn(),
      },
    };

    const token = jwt.sign(
      {
        sub: "user-1",
        role: "ROOT",
        type: "access",
      },
      environment.ACCESS_TOKEN_SECRET,
      {
        algorithm: "HS256",
        issuer: environment.JWT_ISSUER,
        audience: environment.JWT_AUDIENCE,
      },
    );

    const error = await run(
      createAuthenticate({ db }),
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(error).toMatchObject({
      statusCode: 401,
      code: "INVALID_ACCESS_TOKEN",
    });

    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.disasterManager.findUnique).not.toHaveBeenCalled();
    expect(db.systemAdmin.findUnique).not.toHaveBeenCalled();
  });
});