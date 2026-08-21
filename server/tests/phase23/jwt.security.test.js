import jwt from "jsonwebtoken";

import { signAccessToken, verifyAccessToken } from "../../src/common/utils/jwt.js";
import { environment } from "../../src/config/environment.js";

describe("Phase 23 JWT hardening", () => {
  test("signs and verifies access tokens with HS256", () => {
    const token = signAccessToken({ id: "user-1", role: "TOURIST" }, environment);
    const header = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"));

    expect(header.alg).toBe("HS256");
    expect(verifyAccessToken(token, environment)).toMatchObject({
      sub: "user-1",
      role: "TOURIST",
      type: "access",
    });
  });

  test("rejects tokens signed with a different algorithm", () => {
    const token = jwt.sign(
      { sub: "user-1", role: "TOURIST", type: "access" },
      environment.ACCESS_TOKEN_SECRET,
      {
        algorithm: "HS384",
        issuer: environment.JWT_ISSUER,
        audience: environment.JWT_AUDIENCE,
      },
    );

    expect(() => verifyAccessToken(token, environment)).toThrow();
  });
});
