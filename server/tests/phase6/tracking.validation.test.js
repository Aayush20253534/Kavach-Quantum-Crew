import {
  latestLocationQuerySchema,
  locationPingBodySchema,
} from "../../src/modules/tracking/tracking.validation.js";

describe("Phase 6 tracking validation", () => {
  test("accepts a valid location ping", () => {
    const result = locationPingBodySchema.safeParse({
      tripId: "11111111-1111-4111-8111-111111111111",
      latitude: 25.4358,
      longitude: 81.8463,
      accuracyM: 12,
      timestamp: "2026-08-21T10:00:00+05:30",
      batteryLevel: 76,
      networkStatus: "CELLULAR",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid coordinates", () => {
    const result = locationPingBodySchema.safeParse({
      tripId: "11111111-1111-4111-8111-111111111111",
      latitude: 120,
      longitude: 81.8,
      accuracyM: 12,
      timestamp: "2026-08-21T10:00:00+05:30",
    });
    expect(result.success).toBe(false);
  });

  test("requires a trip id for latest-location lookup", () => {
    expect(latestLocationQuerySchema.safeParse({}).success).toBe(false);
  });
});
