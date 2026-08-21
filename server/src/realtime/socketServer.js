import { Server as SocketServer } from "socket.io";

import { buildSocketCorsOptions } from "../config/cors.js";
import { environment } from "../config/environment.js";
import { logger } from "../config/logger.js";

export const createSocketServer = (
  httpServer,
  { config = environment, log = logger } = {},
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

  io.engine.on("connection_error", (error) => {
    log.warn({ err: error }, "Socket.IO connection error");
  });

  io.on("connection", (socket) => {
    const socketLog = log.child({ socketId: socket.id });
    socketLog.info("Socket.IO client connected");

    // Phase 0 exposes no location or incident events. Authenticated gateways are added later.
    socket.emit("system:ready", {
      service: config.APP_NAME,
      version: config.APP_VERSION,
      connectedAt: new Date().toISOString(),
    });

    socket.on("disconnect", (reason) => {
      socketLog.info({ reason }, "Socket.IO client disconnected");
    });
  });

  return io;
};

export default createSocketServer;
