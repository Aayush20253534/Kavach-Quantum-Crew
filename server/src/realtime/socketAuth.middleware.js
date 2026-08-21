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

export const createSocketAuthenticator = ({ db = prisma, config = environment } = {}) =>
  async function socketAuthenticator(socket, next) {
    try {
      const token = extractToken(socket);
      if (!token) return next();
      const payload = verifyAccessToken(token, config);
      if (payload.type !== "access" || payload.role !== ROLES.TOURIST || !payload.sub) {
        return next(new Error("SOCKET_ACCESS_DENIED"));
      }
      const user = await db.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, status: true },
      });
      if (!user || user.status !== "ACTIVE") return next(new Error("SOCKET_ACCOUNT_INACTIVE"));
      socket.data.user = { id: user.id, role: ROLES.TOURIST };
      return next();
    } catch {
      return next(new Error("SOCKET_ACCESS_TOKEN_INVALID"));
    }
  };

export const socketAuthenticator = createSocketAuthenticator();
