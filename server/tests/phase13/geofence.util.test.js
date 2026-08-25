import { pointInPolygon, zoneContainsPoint, zoneIntersectsCircle, zoneIsEffective } from "../../src/common/utils/geofence.js";

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


  test("detects when a group safety circle overlaps a danger-zone circle", () => {
    const zone = {
      geometryType: "CIRCLE",
      latitude: 25.495,
      longitude: 81.869,
      radiusM: 250,
    };
    const tourist = { latitude: 25.5005, longitude: 81.869 };

    expect(zoneContainsPoint(zone, tourist)).toBe(false);
    expect(zoneIntersectsCircle(zone, tourist, 500)).toBe(true);
  });

  test("detects group-circle overlap with polygon boundaries", () => {
    const zone = {
      geometryType: "POLYGON",
      polygon: [
        { latitude: 25.49, longitude: 81.86 },
        { latitude: 25.49, longitude: 81.87 },
        { latitude: 25.50, longitude: 81.87 },
        { latitude: 25.50, longitude: 81.86 },
      ],
    };

    const nearby = { latitude: 25.504, longitude: 81.865 };
    expect(zoneContainsPoint(zone, nearby)).toBe(false);
    expect(zoneIntersectsCircle(zone, nearby, 500)).toBe(true);
  });

  test("respects activation and validity windows", () => {
    const now = new Date("2026-08-21T18:00:00Z");
    expect(zoneIsEffective({ active: true, validFrom: new Date("2026-08-21T17:00:00Z"), validUntil: new Date("2026-08-21T19:00:00Z") }, now)).toBe(true);
    expect(zoneIsEffective({ active: false }, now)).toBe(false);
  });
});
