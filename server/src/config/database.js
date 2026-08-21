import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { environment } from "./environment.js";
import { logger } from "./logger.js";

const createPrismaClient = ({ databaseUrl, poolMax, connectionTimeoutMs }) => {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    max: poolMax,
    connectionTimeoutMillis: connectionTimeoutMs,
  });

  return new PrismaClient({
    adapter,
    log: environment.IS_DEVELOPMENT ? ["warn", "error"] : ["error"],
  });
};

export const createDatabase = ({
  client,
  databaseUrl = environment.DATABASE_URL,
  poolMax = environment.DATABASE_POOL_MAX,
  connectionTimeoutMs = environment.DATABASE_CONNECTION_TIMEOUT_MS,
  log = logger,
} = {}) => {
  const prismaClient =
    client ?? createPrismaClient({ databaseUrl, poolMax, connectionTimeoutMs });
  let connected = false;

  return Object.freeze({
    get client() {
      return prismaClient;
    },

    get isConnected() {
      return connected;
    },

    async connect() {
      if (connected) return;

      await prismaClient.$connect();
      connected = true;
      log.info("PostgreSQL connection established");
    },

    async ping() {
      const startedAt = performance.now();
      await prismaClient.$queryRawUnsafe("SELECT 1");

      return {
        latencyMs: Math.max(
          0,
          Math.round((performance.now() - startedAt) * 100) / 100,
        ),
      };
    },

    async disconnect() {
      try {
        await prismaClient.$disconnect();
      } finally {
        connected = false;
      }
      log.info("PostgreSQL connection closed");
    },
  });
};

export const database = createDatabase();
export const prisma = database.client;

export const connectDatabase = () => database.connect();
export const pingDatabase = () => database.ping();
export const disconnectDatabase = () => database.disconnect();

export default database;
