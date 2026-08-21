import { monitoringPolicyBodySchema } from "../../src/modules/monitoring/monitoring.validation.js";

describe("Phase 14 monitoring validation", () => {
  test("accepts a monitoring policy with a planned route", () => {
    const value = monitoringPolicyBodySchema.parse({
      trackingGapAfterMinutes: 5,
      groupSeparationM: 800,
      plannedRoute: [{ latitude: 27.7, longitude: 85.3 }, { latitude: 27.71, longitude: 85.31 }],
    });
    expect(value.groupSeparationM).toBe(800);
  });

  test("rejects an empty update", () => {
    expect(() => monitoringPolicyBodySchema.parse({})).toThrow();
  });
});
