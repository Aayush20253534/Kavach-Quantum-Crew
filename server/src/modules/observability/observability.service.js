import { ApiError } from "../../common/errors/ApiError.js";
import { healthRepository } from "../health/health.repository.js";
import { ROLES } from "../../constants/roles.js";
import { metricsRegistry } from "../../observability/metrics.js";

const requireAdmin = (actor) => {
  if (actor?.role !== ROLES.SYSTEM_ADMIN) {
    throw ApiError.forbidden("Observability access requires system administrator privileges", {
      code: "OBSERVABILITY_ACCESS_FORBIDDEN",
    });
  }
};

export const createObservabilityService = ({
  registry = metricsRegistry,
  repository = healthRepository,
  memoryUsage = () => process.memoryUsage(),
  uptime = () => process.uptime(),
  clock = () => new Date(),
} = {}) => Object.freeze({
  metrics(actor) {
    requireAdmin(actor);
    return registry.snapshot();
  },

  async diagnostics(actor) {
    requireAdmin(actor);
    let database;
    try {
      database = { status: "up", ...(await repository.checkDatabase()) };
    } catch {
      database = { status: "down" };
    }

    const memory = memoryUsage();
    return {
      status: database.status === "up" ? "healthy" : "degraded",
      checkedAt: clock().toISOString(),
      uptimeSeconds: Math.floor(uptime()),
      memory: {
        rssBytes: memory.rss,
        heapTotalBytes: memory.heapTotal,
        heapUsedBytes: memory.heapUsed,
        externalBytes: memory.external,
      },
      database,
      metrics: registry.snapshot(),
    };
  },
});

export const observabilityService = createObservabilityService();
export default observabilityService;
