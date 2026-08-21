import { verifyAccessToken } from "../common/utils/jwt.js";
import { prisma } from "../config/database.js";
import { environment } from "../config/environment.js";
import { ROLES } from "../constants/roles.js";

const extractToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) return authToken.trim();
  const header = socket.handshake?.headers?.authorization;
  if (typeof header !== "string") return null;
  const [scheme, token] = header.trim().split(/\s+/);
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
};

const findAccount = async (db, id, role) => {
  const query = { where: { id }, select: { id: true, status: true } };
  if (role === ROLES.TOURIST) return db.user.findUnique(query);
  if (role === ROLES.DISASTER_MANAGER) return db.disasterManager.findUnique(query);
  if (role === ROLES.SYSTEM_ADMIN) return db.systemAdmin.findUnique(query);
  return null;
};

export const createSocketAuthenticator = ({ db = prisma, config = environment } = {}) =>
  async function socketAuthenticator(socket, next) {
    try {
      const token = extractToken(socket);
      if (!token) return next();
      const payload = verifyAccessToken(token, config);
      if (payload.type !== "access" || !payload.sub || !Object.values(ROLES).includes(payload.role)) {
        return next(new Error("SOCKET_ACCESS_DENIED"));
      }
      const account = await findAccount(db, payload.sub, payload.role);
      if (!account || account.status !== "ACTIVE") return next(new Error("SOCKET_ACCOUNT_INACTIVE"));
      socket.data.user = { id: account.id, role: payload.role };
      return next();
    } catch {
      return next(new Error("SOCKET_ACCESS_TOKEN_INVALID"));
    }
  };

export const socketAuthenticator = createSocketAuthenticator();
