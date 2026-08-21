import { analyticsRangeQuerySchema } from "../../src/modules/analytics/analytics.validation.js";

describe("Phase 19 analytics validation", () => {
  test("accepts and coerces a valid date range", () => {
    const result = analyticsRangeQuerySchema.parse({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-22T00:00:00.000Z",
    });

    expect(result.from).toEqual(new Date("2026-08-01T00:00:00.000Z"));
    expect(result.to).toEqual(new Date("2026-08-22T00:00:00.000Z"));
  });

  test("allows an open-ended range", () => {
    const result = analyticsRangeQuerySchema.parse({
      from: "2026-08-01T00:00:00.000Z",
    });

    expect(result.from).toEqual(new Date("2026-08-01T00:00:00.000Z"));
    expect(result.to).toBeUndefined();
  });

  test("rejects a range whose end precedes its start", () => {
    const result = analyticsRangeQuerySchema.safeParse({
      from: "2026-08-22T00:00:00.000Z",
      to: "2026-08-01T00:00:00.000Z",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "to must be on or after from",
      );
    }
  });

  test("rejects malformed dates", () => {
    expect(
      analyticsRangeQuerySchema.safeParse({
        from: "definitely-not-a-date",
      }).success,
    ).toBe(false);
  });
});
