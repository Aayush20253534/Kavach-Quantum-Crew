import { jest } from "@jest/globals";
import { createTrackingService } from "../../src/modules/tracking/tracking.service.js";

const now = new Date("2026-08-21T10:00:00.000Z");

describe("Phase 7 tracking safety hook", () => {
  test("evaluates deterministic safety rules after a trusted ping", async () => {
    const repository = {
      findTripContext: jest.fn().mockResolvedValue({
        id: "t1",
        touristId: "u1",
        status: "ACTIVE",
        consents: [{ type: "LOCATION_TRACKING", status: "GRANTED", revokedAt: null }],
        group: null,
      }),
      findDuplicate: jest.fn().mockResolvedValue(null),
      findLatest: jest.fn().mockResolvedValue(null),
      createPingAndUpdateLatest: jest.fn().mockResolvedValue({
        id: "p1",
        tripId: "t1",
        userId: "u1",
        latitude: 25.4358,
        longitude: 81.8463,
        accuracyM: 10,
        capturedAt: now,
        trustStatus: "TRUSTED",
      }),
    };
    const publisher = { publishLocationUpdated: jest.fn() };
    const safetyEvaluator = {
      evaluateLocation: jest.fn().mockResolvedValue({ level: "WARNING", events: [], activeRiskZones: [] }),
    };
    const service = createTrackingService({ repository, publisher, safetyEvaluator, clock: () => now });

    const result = await service.submitPing("u1", {
      tripId: "t1",
      latitude: 25.4358,
      longitude: 81.8463,
      accuracyM: 10,
      timestamp: now.toISOString(),
    });

    expect(safetyEvaluator.evaluateLocation).toHaveBeenCalledWith(
      expect.objectContaining({ tripId: "t1", userId: "u1", pingId: "p1" }),
    );
    expect(result.safety.level).toBe("WARNING");
  });
});
