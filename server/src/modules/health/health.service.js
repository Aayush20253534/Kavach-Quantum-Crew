import { environment } from "../../config/environment.js";
import { logger } from "../../config/logger.js";
import { healthRepository } from "./health.repository.js";

const checkedAt = () => new Date().toISOString();

export const createHealthService = ({
  repository = healthRepository,
  config = environment,
  log = logger,
  uptime = () => process.uptime(),
} = {}) =>
  Object.freeze({
    getLiveness() {
      return {
        statusCode: 200,
        message: "Service is alive",
        data: {
          status: "ok",
          service: config.APP_NAME,
          version: config.APP_VERSION,
          environment: config.NODE_ENV,
          uptimeSeconds: Math.floor(uptime()),
          checkedAt: checkedAt(),
        },
      };
    },

    async getReadiness() {
      try {
        const databaseCheck = await repository.checkDatabase();

        return {
          statusCode: 200,
          message: "Service is ready",
          data: {
            status: "ready",
            checks: {
              database: { status: "up", ...databaseCheck },
            },
            checkedAt: checkedAt(),
          },
        };
      } catch (error) {
        log.warn({ err: error }, "Readiness check failed");

        return {
          statusCode: 503,
          message: "Service is not ready",
          data: {
            status: "not_ready",
            checks: {
              database: { status: "down" },
            },
            checkedAt: checkedAt(),
          },
        };
      }
    },

    async getDatabaseHealth() {
      try {
        const databaseCheck = await repository.checkDatabase();

        return {
          statusCode: 200,
          message: "Database is reachable",
          data: {
            status: "up",
            ...databaseCheck,
            checkedAt: checkedAt(),
          },
        };
      } catch (error) {
        log.warn({ err: error }, "Database health check failed");

        return {
          statusCode: 503,
          message: "Database is unreachable",
          data: {
            status: "down",
            checkedAt: checkedAt(),
          },
        };
      }
    },
  });

export const healthService = createHealthService();

export default healthService;
