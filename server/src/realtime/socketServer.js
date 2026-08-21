import { Server as SocketServer } from "socket.io";

import { buildSocketCorsOptions } from "../config/cors.js";
import { environment } from "../config/environment.js";
import { logger } from "../config/logger.js";
import { trackingRepository } from "../modules/tracking/tracking.repository.js";
import { setLocationSocketServer } from "./locationPublisher.js";
import { socketAuthenticator } from "./socketAuth.middleware.js";

export const createSocketServer = (
  httpServer,
  {
    config = environment,
    log = logger,
    authenticator = socketAuthenticator,
    trackingRepo = trackingRepository,
  } = {},
) => {
  const io = new SocketServer(httpServer, {
    cors: buildSocketCorsOptions(config),
    serveClient: false,
    transports: ["websocket", "polling"],
    maxHttpBufferSize: 1_000_000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 120_000,
      skipMiddlewares: false,
    },
  });

  io.use(authenticator);
  setLocationSocketServer(io);

  io.engine.on("connection_error", (error) => {
    log.warn({ err: error }, "Socket.IO connection error");
  });

  io.on("connection", (socket) => {
    const socketLog = log.child({
      socketId: socket.id,
      userId: socket.data.user?.id,
    });

    socketLog.info("Socket.IO client connected");

    if (socket.data.user?.id) {
      socket.join(`tourist:${socket.data.user.id}`);
    }

    socket.emit("system:ready", {
      service: config.APP_NAME,
      version: config.APP_VERSION,
      connectedAt: new Date().toISOString(),
      authenticated: Boolean(socket.data.user?.id),
    });

    socket.on(
      "tracking:subscribe",
      async (payload = {}, acknowledge = () => {}) => {
        try {
          if (!socket.data.user?.id) {
            acknowledge({
              ok: false,
              code: "SOCKET_AUTH_REQUIRED",
            });
            return;
          }

          const tripId = payload.tripId;

          if (typeof tripId !== "string") {
            acknowledge({
              ok: false,
              code: "TRIP_ID_REQUIRED",
            });
            return;
          }

          const access = await trackingRepo.canSubscribeToTrip(
            tripId,
            socket.data.user.id,
          );

          if (!access) {
            acknowledge({
              ok: false,
              code: "TRACKING_SUBSCRIPTION_FORBIDDEN",
            });
            return;
          }

          await socket.join(`trip:${access.tripId}`);

          if (access.groupId) {
            await socket.join(`group:${access.groupId}`);
          }

          acknowledge({
            ok: true,
            tripId: access.tripId,
            groupId: access.groupId,
          });
        } catch (error) {
          socketLog.warn(
            { err: error },
            "Tracking room subscription failed",
          );

          acknowledge({
            ok: false,
            code: "TRACKING_SUBSCRIPTION_FAILED",
          });
        }
      },
    );

    socket.on("disconnect", (reason) => {
      socketLog.info(
        { reason },
        "Socket.IO client disconnected",
      );
    });
  });

  return io;
};

export default createSocketServer;