import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

import app from "./app.js";
import { database } from "./config/database.js";
import { environment } from "./config/environment.js";
import { logger } from "./config/logger.js";
import { createSocketServer } from "./realtime/socketServer.js";
import { tripLifecycleJob } from "./jobs/tripLifecycle.job.js";
import { blockchainAnchorJob } from "./jobs/blockchainAnchor.job.js";
import { signalLossJob } from "./jobs/signalLoss.job.js";
import { blockchainIntegrityJob } from "./jobs/blockchainIntegrity.job.js";

let activeRuntime = null;
let shutdownPromise = null;

const listen = (server, { host, port }) =>
  new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });

const closeSocketServer = (io) =>
  new Promise((resolve, reject) => {
    if (!io) {
      resolve();
      return;
    }

    io.close((error) => (error ? reject(error) : resolve()));
  });

const closeHttpServer = (server) =>
  new Promise((resolve, reject) => {
    if (!server?.listening) {
      resolve();
      return;
    }

    server.close((error) => (error ? reject(error) : resolve()));
  });

export const startServer = async ({
  application = app,
  db = database,
  config = environment,
  socketFactory = createSocketServer,
  host = config.HOST,
  port = config.PORT,
  log = logger,
} = {}) => {
  if (activeRuntime) return activeRuntime;

  await db.connect();
  const httpServer = createServer(application);
  httpServer.requestTimeout = 30_000;
  httpServer.headersTimeout = 35_000;
  httpServer.keepAliveTimeout = 5_000;

  let io = null;

  try {
    if (config.SOCKET_IO_ENABLED) {
      io = socketFactory(httpServer, { config, log });
    }

    await listen(httpServer, { host, port });
    tripLifecycleJob.start();
    blockchainAnchorJob.start();
    signalLossJob.start();
    blockchainIntegrityJob.start();
  } catch (error) {
    await Promise.allSettled([
      closeSocketServer(io),
      closeHttpServer(httpServer),
      db.disconnect(),
    ]);
    throw error;
  }

  const address = httpServer.address();
  const listeningPort =
    typeof address === "object" && address ? address.port : port;

  activeRuntime = Object.freeze({
    httpServer,
    io,
    db,
    config,
    host,
    port: listeningPort,
  });

  log.info(
    {
      host,
      port: listeningPort,
      environment: config.NODE_ENV,
      socketIo: Boolean(io),
    },
    "Smart Tourist Safety backend started",
  );

  return activeRuntime;
};

export const stopServer = async ({ reason = "manual", log = logger } = {}) => {
  if (shutdownPromise) return shutdownPromise;
  if (!activeRuntime) return;

  const runtime = activeRuntime;
  activeRuntime = null;

  shutdownPromise = (async () => {
    log.info({ reason }, "Graceful shutdown started");

    tripLifecycleJob.stop();
    blockchainAnchorJob.stop();
    signalLossJob.stop();
    blockchainIntegrityJob.stop();

    const shutdownWork = Promise.allSettled([
      closeSocketServer(runtime.io),
      closeHttpServer(runtime.httpServer),
      runtime.db.disconnect(),
    ]);

    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Graceful shutdown timed out")),
        runtime.config.SHUTDOWN_TIMEOUT_MS,
      );
      timeoutId.unref?.();
    });

    try {
      const results = await Promise.race([shutdownWork, timeout]);
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length > 0) {
        throw new AggregateError(
          failures.map((failure) => failure.reason),
          "One or more shutdown tasks failed",
        );
      }
      log.info({ reason }, "Graceful shutdown completed");
    } catch (error) {
      runtime.httpServer.closeAllConnections?.();
      log.error({ err: error, reason }, "Graceful shutdown failed");
      throw error;
    } finally {
      clearTimeout(timeoutId);
      shutdownPromise = null;
    }
  })();

  return shutdownPromise;
};

export const getActiveRuntime = () => activeRuntime;

export const registerProcessHandlers = ({ log = logger } = {}) => {
  let terminating = false;

  const terminate = async (reason, exitCode) => {
    if (terminating) {
      log.fatal(
        { reason },
        "Forced termination after repeated shutdown signal",
      );
      process.exit(exitCode || 1);
    }

    terminating = true;
    try {
      await stopServer({ reason, log });
    } catch {
      exitCode = 1;
    }
    process.exit(exitCode);
  };

  process.once("SIGTERM", () => void terminate("SIGTERM", 0));
  process.once("SIGINT", () => void terminate("SIGINT", 0));
  process.once("uncaughtException", (error) => {
    log.fatal({ err: error }, "Uncaught exception");
    void terminate("uncaughtException", 1);
  });
  process.once("unhandledRejection", (error) => {
    log.fatal({ err: error }, "Unhandled promise rejection");
    void terminate("unhandledRejection", 1);
  });
};

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  registerProcessHandlers();
  startServer().catch((error) => {
    logger.fatal({ err: error }, "Backend startup failed");
    process.exitCode = 1;
  });
}
