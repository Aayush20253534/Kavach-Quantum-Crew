import { createHazardBodySchema, nearbyHazardQuerySchema } from "../../src/modules/hazard/hazard.validation.js";

describe("Phase 12 hazard validation", () => {
  test("accepts a valid hazard report", () => {
    expect(createHazardBodySchema.parse({ type: "LANDSLIDE", severity: "HIGH", title: "Slope failure", description: "Large debris blocking the road", latitude: 27.7, longitude: 85.3 })).toMatchObject({ type: "LANDSLIDE", severity: "HIGH" });
  });

  test("rejects invalid coordinates", () => {
    expect(() => createHazardBodySchema.parse({ type: "FLOOD", title: "Flooding", description: "Water above road level", latitude: 120, longitude: 85 })).toThrow();
  });

  test("limits nearby radius", () => {
    expect(() => nearbyHazardQuerySchema.parse({ latitude: 27, longitude: 85, radiusKm: 101 })).toThrow();
  });
});
