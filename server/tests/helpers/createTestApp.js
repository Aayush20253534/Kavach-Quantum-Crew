import { createApp } from "../../src/app.js";

const healthyService = Object.freeze({
  getLiveness: () => ({
    statusCode: 200,
    message: "Service is alive",
    data: { status: "ok" },
  }),
  getReadiness: async () => ({
    statusCode: 200,
    message: "Service is ready",
    data: {
      status: "ready",
      checks: { database: { status: "up", latencyMs: 1 } },
    },
  }),
  getDatabaseHealth: async () => ({
    statusCode: 200,
    message: "Database is reachable",
    data: { status: "up", latencyMs: 1 },
  }),
});

export const createTestApp = ({
  healthService = healthyService,
  ...options
} = {}) => createApp({ healthService, ...options });

export { healthyService };
export default createTestApp;
