import { randomInt, randomUUID, timingSafeEqual } from "node:crypto";

import { ApiError } from "../../common/errors/ApiError.js";
import { sha256 } from "../../common/utils/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.js";
import { hashPassword, verifyPassword } from "../../common/utils/password.js";
import { environment } from "../../config/environment.js";
import { ROLES } from "../../constants/roles.js";
import { authRepository } from "./auth.repository.js";
import { emailService } from "./email.service.js";

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

const generateOtp = () => String(randomInt(100000, 1000000));

const otpHash = (userId, otp, config) =>
  sha256(`${userId}:${otp}:${config.EMAIL_OTP_SECRET}`);

const hashMatches = (actual, expected) => {
  const left = Buffer.from(actual, "hex");
  const right = Buffer.from(expected, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
};

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

export const createAuthService = ({
  repository = authRepository,
  mailer = emailService,
  config = environment,
  clock = () => new Date(),
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

  const sendOtp = async (user) => {
    const now = clock();
    const otp = generateOtp();
    const expiresAt = addMinutes(now, config.EMAIL_OTP_TTL_MINUTES);

    await repository.upsertEmailVerificationOtp(user.id, {
      codeHash: otpHash(user.id, otp, config),
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    try {
      await mailer.sendVerificationOtp({
        to: user.email,
        name: user.name,
        otp,
        expiresInMinutes: config.EMAIL_OTP_TTL_MINUTES,
      });
    } catch (error) {
      await repository.deleteEmailVerificationOtp(user.id);
      throw error;
    }

    return { expiresAt };
  };

  return Object.freeze({
    async register(input) {
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

      try {
        const { expiresAt } = await sendOtp(user);
        return {
          user: sanitizeUser(user),
          verificationRequired: true,
          emailSent: true,
          otpExpiresAt: expiresAt,
        };
      } catch (error) {
        if (!["EMAIL_PROVIDER_NOT_CONFIGURED", "EMAIL_DELIVERY_FAILED"].includes(error.code)) {
          throw error;
        }
        return {
          user: sanitizeUser(user),
          verificationRequired: true,
          emailSent: false,
          otpExpiresAt: null,
        };
      }
    },

    async verifyEmail({ email, otp }, context = {}) {
      const user = await repository.findTouristByEmail(email);
      if (!user) {
        throw ApiError.badRequest("Verification code is invalid or expired", {
          code: "EMAIL_OTP_INVALID",
        });
      }
      if (user.emailVerifiedAt) {
        throw ApiError.conflict("Email is already verified", {
          code: "EMAIL_ALREADY_VERIFIED",
        });
      }

      const record = await repository.findEmailVerificationOtp(user.id);
      const now = clock();

      if (!record || record.expiresAt <= now) {
        if (record) await repository.deleteEmailVerificationOtp(user.id);
        throw ApiError.badRequest("Verification code is invalid or expired", {
          code: "EMAIL_OTP_EXPIRED",
        });
      }

      if (record.attempts >= config.EMAIL_OTP_MAX_ATTEMPTS) {
        await repository.deleteEmailVerificationOtp(user.id);
        throw ApiError.tooManyRequests("Too many invalid verification attempts", {
          code: "EMAIL_OTP_ATTEMPTS_EXCEEDED",
        });
      }

      const suppliedHash = otpHash(user.id, otp, config);
      if (!hashMatches(suppliedHash, record.codeHash)) {
        const next = await repository.incrementEmailVerificationAttempts(user.id);
        if (next.attempts >= config.EMAIL_OTP_MAX_ATTEMPTS) {
          await repository.deleteEmailVerificationOtp(user.id);
        }
        throw ApiError.badRequest("Verification code is invalid or expired", {
          code: "EMAIL_OTP_INVALID",
        });
      }

      const verifiedUser = await repository.markTouristEmailVerified(user.id, now);
      await repository.deleteEmailVerificationOtp(user.id);
      const tokens = await issueSession(verifiedUser, context);

      return { user: sanitizeUser(verifiedUser), ...tokens };
    },

    async resendEmailVerification({ email }) {
      const user = await repository.findTouristByEmail(email);
      if (!user || user.emailVerifiedAt) {
        return { accepted: true };
      }

      const existing = await repository.findEmailVerificationOtp(user.id);
      if (existing) {
        const retryAt = new Date(
          existing.lastSentAt.getTime() +
            config.EMAIL_OTP_RESEND_COOLDOWN_SECONDS * 1000,
        );
        if (retryAt > clock()) return { accepted: true };
      }

      await sendOtp(user);
      return { accepted: true };
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
      if (user.role === ROLES.TOURIST && !user.emailVerifiedAt) {
        throw ApiError.forbidden("Email verification is required", {
          code: "EMAIL_VERIFICATION_REQUIRED",
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
      if (
        session.accountRole === ROLES.TOURIST &&
        !session.account.emailVerifiedAt
      ) {
        throw ApiError.forbidden("Email verification is required", {
          code: "EMAIL_VERIFICATION_REQUIRED",
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
        // Logout is intentionally idempotent. Invalid/expired tokens are discarded.
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
