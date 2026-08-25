import { ApiError } from "../common/errors/ApiError.js";
import { verifyAccessToken } from "../common/utils/jwt.js";
import { prisma } from "../config/database.js";
import { ROLES } from "../constants/roles.js";

const extractBearerToken = (header) => {
  if (typeof header !== "string") return null;
  const [scheme, token] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

const findAccount = async (db, id, role) => {
  const baseSelect = {
    id: true,
    name: true,
    username: true,
    email: true,
    phone: true,
    status: true,
  };

  if (role === ROLES.TOURIST) {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        ...baseSelect,
        onboardingCompleted: true,
        emailVerifiedAt: true,
      },
    });
    return user ? { ...user, role } : null;
  }
  if (role === ROLES.DISASTER_MANAGER) {
    const user = await db.disasterManager.findUnique({ where: { id }, select: baseSelect });
    return user ? { ...user, role } : null;
  }
  if (role === ROLES.SYSTEM_ADMIN) {
    const user = await db.systemAdmin.findUnique({ where: { id }, select: baseSelect });
    return user ? { ...user, role } : null;
  }
  if ([ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE].includes(role)) {
    const user = await db.emergencyServiceAccount.findUnique({
      where: { id },
      select: { ...baseSelect, serviceType: true, latitude: true, longitude: true },
    });
    if (!user || user.serviceType !== role) return null;
    return { ...user, role };
  }
  return null;
};

export const createAuthenticate = ({ db = prisma } = {}) =>
  async function authenticate(request, _response, next) {
    try {
      const token = extractBearerToken(request.headers.authorization);
      if (!token) {
        throw ApiError.unauthorized("Access token is required", {
          code: "ACCESS_TOKEN_REQUIRED",
        });
      }

      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        throw ApiError.unauthorized("Access token is invalid or expired", {
          code: "INVALID_ACCESS_TOKEN",
        });
      }

      if (
        payload.type !== "access" ||
        !payload.sub ||
        !payload.role ||
        !Object.values(ROLES).includes(payload.role)
      ) {
        throw ApiError.unauthorized("Access token is invalid", {
          code: "INVALID_ACCESS_TOKEN",
        });
      }

      const user = await findAccount(db, payload.sub, payload.role);
      if (!user) {
        throw ApiError.unauthorized("Account no longer exists", {
          code: "ACCOUNT_NOT_FOUND",
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

      request.user = user;
      request.auth = { token, payload };
      return next();
    } catch (error) {
      return next(error);
    }
  };

export const authenticate = createAuthenticate();
export default authenticate;
