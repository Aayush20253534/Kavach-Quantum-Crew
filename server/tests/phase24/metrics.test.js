import { createMetricsRegistry } from "../../src/observability/metrics.js";

describe("Phase 24 metrics registry", () => {
  test("tracks request counts, status classes, and duration", () => {
    let now = 1_000;
    const registry = createMetricsRegistry({ clock: () => now });
    const startedAt = registry.requestStarted();
    now = 1_025;
    registry.requestFinished({ method: "GET", statusCode: 200, startedAt });
    const snapshot = registry.snapshot();
    expect(snapshot.totalRequests).toBe(1);
    expect(snapshot.activeRequests).toBe(0);
    expect(snapshot.averageDurationMs).toBe(25);
    expect(snapshot.requestsByMethod).toEqual({ GET: 1 });
    expect(snapshot.requestsByStatusClass).toEqual({ "2xx": 1 });
  });

  test("never lets active requests become negative", () => {
    const registry = createMetricsRegistry({ clock: () => 1_000 });
    registry.requestFinished({ method: "GET", statusCode: 500, startedAt: 1_000 });
    expect(registry.snapshot().activeRequests).toBe(0);
  });
});
