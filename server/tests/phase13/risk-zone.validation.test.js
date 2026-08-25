import { createRiskZoneBodySchema } from "../../src/modules/risk-zone/risk-zone.validation.js";

describe("Phase 13 risk zone validation", () => {
  test("accepts a circular risk zone", () => {
    expect(createRiskZoneBodySchema.parse({ name: "Flood belt", type: "RISK", severity: "HIGH", geometryType: "CIRCLE", latitude: 27.7, longitude: 85.3, radiusM: 1500 })).toMatchObject({ geometryType: "CIRCLE" });
  });

  test("accepts a polygon risk zone", () => {
    const result = createRiskZoneBodySchema.parse({ name: "Restricted valley", type: "RISK", severity: "CRITICAL", geometryType: "POLYGON", polygon: [{ latitude: 27, longitude: 85 }, { latitude: 27, longitude: 86 }, { latitude: 28, longitude: 85 }] });
    expect(result.polygon).toHaveLength(3);
  });

  test("rejects polygon zones without enough vertices", () => {
    expect(() => createRiskZoneBodySchema.parse({ name: "Bad polygon", type: "RISK", geometryType: "POLYGON", polygon: [{ latitude: 27, longitude: 85 }, { latitude: 28, longitude: 85 }] })).toThrow();
  });
});
