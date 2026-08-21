import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

import { environment } from "../../config/environment.js";

export const signAccessToken = (user, config = environment) =>
  jwt.sign(
    { sub: user.id, role: user.role, type: "access" },
    config.ACCESS_TOKEN_SECRET,
    {
      expiresIn: config.ACCESS_TOKEN_TTL,
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      algorithm: "HS256",
    },
  );

export const signRefreshToken = ({ userId, sessionId }, config = environment) =>
  jwt.sign(
    { sub: userId, sid: sessionId, jti: randomUUID(), type: "refresh" },
    config.REFRESH_TOKEN_SECRET,
    {
      expiresIn: `${config.REFRESH_TOKEN_TTL_DAYS}d`,
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
      algorithm: "HS256",
    },
  );

export const verifyAccessToken = (token, config = environment) =>
  jwt.verify(token, config.ACCESS_TOKEN_SECRET, {
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
    algorithms: ["HS256"],
  });

export const verifyRefreshToken = (token, config = environment) =>
  jwt.verify(token, config.REFRESH_TOKEN_SECRET, {
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
    algorithms: ["HS256"],
  });
