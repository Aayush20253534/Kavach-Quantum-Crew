const statusClass = (statusCode) => `${Math.floor(statusCode / 100)}xx`;

export const createMetricsRegistry = ({ clock = () => Date.now() } = {}) => {
  const startedAtMs = clock();
  let activeRequests = 0;
  let totalRequests = 0;
  let totalDurationMs = 0;
  const byMethod = new Map();
  const byStatusClass = new Map();

  const increment = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

  return Object.freeze({
    requestStarted() {
      activeRequests += 1;
      return clock();
    },

    requestFinished({ method, statusCode, startedAt }) {
      activeRequests = Math.max(0, activeRequests - 1);
      totalRequests += 1;
      totalDurationMs += Math.max(0, clock() - startedAt);
      increment(byMethod, method || "UNKNOWN");
      increment(byStatusClass, statusClass(statusCode || 500));
    },

    snapshot() {
      return {
        startedAt: new Date(startedAtMs).toISOString(),
        uptimeMs: Math.max(0, clock() - startedAtMs),
        activeRequests,
        totalRequests,
        averageDurationMs: totalRequests === 0 ? 0 : Number((totalDurationMs / totalRequests).toFixed(2)),
        requestsByMethod: Object.fromEntries(byMethod),
        requestsByStatusClass: Object.fromEntries(byStatusClass),
      };
    },

    reset() {
      activeRequests = 0;
      totalRequests = 0;
      totalDurationMs = 0;
      byMethod.clear();
      byStatusClass.clear();
    },
  });
};

export const metricsRegistry = createMetricsRegistry();
export default metricsRegistry;
