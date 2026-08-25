import { createDashboardService } from "../../src/modules/dashboard/dashboard.service.js";

describe("Dashboard safety status synchronization", () => {
  test("marks a group trip dangerous when its 500m boundary overlaps a risk zone", async () => {
    const repository = {
      totalTourists: async () => 5,
      activeAlerts: async () => 1,
      currentTrip: async () => ({
        id: "trip-1",
        tripType: "GROUP",
        status: "ACTIVE",
        locationName: "Prayagraj",
        group: { members: [{ id: "member-1" }] },
      }),
      activeRiskZones: async () => [{
        id: "zone-1",
        name: "Teliyarganj Chauraha",
        type: "RISK",
        severity: "HIGH",
        active: true,
        geometryType: "CIRCLE",
        latitude: 25.495,
        longitude: 81.869,
        radiusM: 250,
      }],
    };

    const service = createDashboardService({
      repository,
      clock: () => new Date("2026-08-23T18:00:00Z"),
      logger: { error: jest.fn() },
    });

    const result = await service.touristSummary("user-1", {
      latitude: 25.5005,
      longitude: 81.869,
    });

    expect(result.safetyStatus).toEqual({
      level: "DANGER",
      zone: {
        id: "zone-1",
        name: "Teliyarganj Chauraha",
        severity: "HIGH",
      },
    });
  });
});
