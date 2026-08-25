import {
  alertListQuerySchema,
  createZoneBodySchema,
  scheduleCheckInBodySchema,
} from "../../src/modules/safety/safety.validation.js";

describe("Phase 7 safety validation", () => {
  test("accepts a circular risk zone", () => {
    const parsed = createZoneBodySchema.parse({
      name: "River Flood Risk",
      type: "RISK",
      severity: "HIGH",
      latitude: 25.4358,
      longitude: 81.8463,
      radiusM: 500,
    });
    expect(parsed.type).toBe("RISK");
    expect(parsed.radiusM).toBe(500);
  });

  test("rejects invalid geofence radius", () => {
    expect(() =>
      createZoneBodySchema.parse({
        name: "Bad zone",
        type: "SAFE",
        latitude: 25,
        longitude: 81,
        radiusM: 0,
      }),
    ).toThrow();
  });

  test("coerces a check-in timestamp", () => {
    const parsed = scheduleCheckInBodySchema.parse({ dueAt: "2026-08-21T12:00:00.000Z" });
    expect(parsed.dueAt).toBeInstanceOf(Date);
  });

  test("limits alert history page size", () => {
    expect(alertListQuerySchema.parse({ limit: "25" }).limit).toBe(25);
    expect(() => alertListQuerySchema.parse({ limit: "101" })).toThrow();
  });
});
