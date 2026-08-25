import { Server as SocketServer } from "socket.io";

import { buildSocketCorsOptions } from "../config/cors.js";
import { environment } from "../config/environment.js";
import { logger } from "../config/logger.js";
import { incidentRepository } from "../modules/incident/incident.repository.js";
import { trackingRepository } from "../modules/tracking/tracking.repository.js";
import { registerGroupGateway } from "./group.gateway.js";
import { registerIncidentGateway } from "./incident.gateway.js";
import { setLocationSocketServer } from "./locationPublisher.js";
import { realtimeRooms, setRealtimeSocketServer } from "./realtimePublisher.js";
import { socketAuthenticator } from "./socketAuth.middleware.js";
import { registerTrackingGateway } from "./tracking.gateway.js";

export const createSocketServer = (
  httpServer,
  {
    config = environment,
    log = logger,
    authenticator = socketAuthenticator,
    trackingRepo = trackingRepository,
    incidentRepo = incidentRepository,
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
  setRealtimeSocketServer(io);

  io.engine.on("connection_error", (error) => {
    log.warn({ err: error }, "Socket.IO connection error");
  });

  io.on("connection", async (socket) => {
    const actor = socket.data.user;
    const socketLog = log.child({ socketId: socket.id, userId: actor?.id, role: actor?.role });
    socketLog.info("Socket.IO client connected");

    if (actor?.id && actor?.role) {
      await socket.join(realtimeRooms.accountRoom(actor.role, actor.id));
      await socket.join(realtimeRooms.roleRoom(actor.role));
      if (actor.role === "TOURIST") await socket.join(`tourist:${actor.id}`);
    }

    socket.emit("system:ready", {
      service: config.APP_NAME,
      version: config.APP_VERSION,
      connectedAt: new Date().toISOString(),
      authenticated: Boolean(actor?.id),
      actor: actor ? { id: actor.id, role: actor.role } : null,
      realtimeVersion: 1,
    });

    registerTrackingGateway(socket, { repository: trackingRepo, log: socketLog });
    registerIncidentGateway(socket, { repository: incidentRepo, log: socketLog });
    registerGroupGateway(socket);

    socket.on("disconnect", (reason) => {
      socketLog.info({ reason }, "Socket.IO client disconnected");
    });
  });

  return io;
};

export default createSocketServer;
