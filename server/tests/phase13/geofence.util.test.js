import { pointInPolygon, zoneContainsPoint, zoneIsEffective } from "../../src/common/utils/geofence.js";

describe("Phase 13 geofence utilities", () => {
  const polygon = [
    { latitude: 27, longitude: 85 },
    { latitude: 27, longitude: 86 },
    { latitude: 28, longitude: 86 },
    { latitude: 28, longitude: 85 },
  ];

  test("detects points inside polygon zones", () => {
    expect(pointInPolygon({ latitude: 27.5, longitude: 85.5 }, polygon)).toBe(true);
    expect(pointInPolygon({ latitude: 29, longitude: 85.5 }, polygon)).toBe(false);
  });

  test("supports circle zones", () => {
    expect(zoneContainsPoint({ geometryType: "CIRCLE", latitude: 27.7, longitude: 85.3, radiusM: 1000 }, { latitude: 27.7005, longitude: 85.3005 })).toBe(true);
  });

  test("respects activation and validity windows", () => {
    const now = new Date("2026-08-21T18:00:00Z");
    expect(zoneIsEffective({ active: true, validFrom: new Date("2026-08-21T17:00:00Z"), validUntil: new Date("2026-08-21T19:00:00Z") }, now)).toBe(true);
    expect(zoneIsEffective({ active: false }, now)).toBe(false);
  });
});
