import { distanceToRouteM } from "../../src/common/utils/routeDistance.js";

describe("Phase 14 route distance", () => {
  test("returns a small distance for a point on the configured corridor", () => {
    const route = [{ latitude: 27.7, longitude: 85.3 }, { latitude: 27.71, longitude: 85.31 }];
    expect(distanceToRouteM({ latitude: 27.705, longitude: 85.305 }, route)).toBeLessThan(20);
  });

  test("returns null when no route is configured", () => {
    expect(distanceToRouteM({ latitude: 27.7, longitude: 85.3 }, [])).toBeNull();
  });
});
