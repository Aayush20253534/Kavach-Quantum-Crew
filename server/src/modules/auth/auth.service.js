import { randomUUID } from "node:crypto";

import { ApiError } from "../../common/errors/ApiError.js";
import { sha256 } from "../../common/utils/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.js";
import { hashPassword, verifyPassword } from "../../common/utils/password.js";
import { environment } from "../../config/environment.js";
import { authRepository } from "./auth.repository.js";

const sanitizeUser = (user) => {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  return safeUser;
};

const sessionExpiry = (days) => {
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + days);
  return expiresAt;
};

const getConflictField = (conflict, input) => {
  if (!conflict) return null;
  if (conflict.username === input.username) return "username";
  if (conflict.email === input.email) return "email";
  if (conflict.phone === input.phone) return "phone";
  return "account";
};

export const createAuthService = ({
  repository = authRepository,
  config = environment,
} = {}) => {
  const issueSession = async (user, context = {}) => {
    const sessionId = randomUUID();
    const accessToken = signAccessToken(user, config);
    const refreshToken = signRefreshToken(
      { userId: user.id, sessionId },
      config,
    );

    await repository.createSession({
      id: sessionId,
      accountId: user.id,
      accountRole: user.role,
      refreshTokenHash: sha256(refreshToken),
      expiresAt: sessionExpiry(config.REFRESH_TOKEN_TTL_DAYS),
      userAgent: context.userAgent?.slice(0, 512) || null,
      ipAddress: context.ipAddress?.slice(0, 64) || null,
    });

    return { accessToken, refreshToken };
  };

  return Object.freeze({
    async register(input, context = {}) {
      const conflict = await repository.findRegistrationConflict(input);
      if (conflict) {
        const field = getConflictField(conflict, input);
        throw ApiError.conflict(`An account with this ${field} already exists`, {
          code: "ACCOUNT_ALREADY_EXISTS",
          details: { field },
        });
      }

      const user = await repository.createTourist({
        name: input.name,
        username: input.username,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
      });
      const tokens = await issueSession(user, context);

      return { user: sanitizeUser(user), ...tokens };
    },

    async login({ identifier, password }, context = {}) {
      const user = await repository.findByLoginIdentifier(identifier);
      if (!user || !(await verifyPassword(user.passwordHash, password))) {
        throw ApiError.unauthorized("Invalid username/email or password", {
          code: "INVALID_CREDENTIALS",
        });
      }
      if (user.status !== "ACTIVE") {
        throw ApiError.forbidden("Account is not active", {
          code: "ACCOUNT_INACTIVE",
        });
      }

      const safeUser = await repository.recordSuccessfulLogin(user.id, user.role);
      const tokens = await issueSession(user, context);
      return { user: sanitizeUser(safeUser), ...tokens };
    },

    async refresh(refreshToken) {
      if (!refreshToken) {
        throw ApiError.unauthorized("Refresh token is required", {
          code: "REFRESH_TOKEN_REQUIRED",
        });
      }

      let payload;
      try {
        payload = verifyRefreshToken(refreshToken, config);
      } catch {
        throw ApiError.unauthorized("Refresh token is invalid or expired", {
          code: "INVALID_REFRESH_TOKEN",
        });
      }

      if (payload.type !== "refresh" || !payload.sid || !payload.sub) {
        throw ApiError.unauthorized("Refresh token is invalid", {
          code: "INVALID_REFRESH_TOKEN",
        });
      }

      const session = await repository.findSession(payload.sid);
      const tokenMatches =
        session && session.refreshTokenHash === sha256(refreshToken);
      if (
        !tokenMatches ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        session.accountId !== payload.sub
      ) {
        throw ApiError.unauthorized("Refresh session is no longer valid", {
          code: "REFRESH_SESSION_INVALID",
        });
      }
      if (!session.account || session.account.status !== "ACTIVE") {
        throw ApiError.forbidden("Account is not active", {
          code: "ACCOUNT_INACTIVE",
        });
      }

      const accessToken = signAccessToken(session.account, config);
      const nextRefreshToken = signRefreshToken(
        { userId: session.accountId, sessionId: session.id, role: session.accountRole },
        config,
      );
      await repository.rotateSession(session.id, {
        refreshTokenHash: sha256(nextRefreshToken),
        expiresAt: sessionExpiry(config.REFRESH_TOKEN_TTL_DAYS),
      });

      return {
        user: sanitizeUser(session.account),
        accessToken,
        refreshToken: nextRefreshToken,
      };
    },

    async logout(refreshToken) {
      if (!refreshToken) return;
      try {
        const payload = verifyRefreshToken(refreshToken, config);
        if (payload.sid) await repository.revokeSession(payload.sid);
      } catch {
        // Logout is intentionally idempotent. Invalid/expired tokens are simply discarded.
      }
    },

    async getMe(userId, role) {
      const user = await repository.findPublicAccountById(userId, role);
      if (!user) {
        throw ApiError.notFound("Account not found", { code: "ACCOUNT_NOT_FOUND" });
      }
      return user;
    },
  });
};

export const authService = createAuthService();
export default authService;
