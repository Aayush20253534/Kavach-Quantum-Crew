import {
  createTripBodySchema,
  grantConsentBodySchema,
  tripHistoryQuerySchema,
} from "../../src/modules/trip/trip.validation.js";

describe("Phase 4 trip validation", () => {
  test("accepts a valid solo trip window", () => {
    const result = createTripBodySchema.safeParse({
      locationName: "Prayagraj",
      tripType: "SOLO",
      plannedStartAt: "2026-08-22T09:00:00+05:30",
      plannedEndAt: "2026-08-22T18:00:00+05:30",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a trip whose end is not after its start", () => {
    const result = createTripBodySchema.safeParse({
      locationName: "Prayagraj",
      tripType: "SOLO",
      plannedStartAt: "2026-08-22T18:00:00+05:30",
      plannedEndAt: "2026-08-22T09:00:00+05:30",
    });
    expect(result.success).toBe(false);
  });

  test("accepts only the two Phase 4 consent types", () => {
    expect(grantConsentBodySchema.safeParse({ type: "LOCATION_TRACKING" }).success).toBe(true);
    expect(grantConsentBodySchema.safeParse({ type: "EMERGENCY_SHARING" }).success).toBe(true);
    expect(grantConsentBodySchema.safeParse({ type: "QR_SHARING" }).success).toBe(false);
  });

  test("applies a safe history page size", () => {
    expect(tripHistoryQuerySchema.parse({})).toEqual({ limit: 20 });
    expect(tripHistoryQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
