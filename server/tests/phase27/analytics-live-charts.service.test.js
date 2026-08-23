import { jest } from "@jest/globals";
import { createAnalyticsService } from "../../src/modules/analytics/analytics.service.js";

describe("Disaster Management analytics live chart data", () => {
  test("returns daily incident volume and response-time buckets from repository rows", async () => {
    const repository = {
      responderJurisdiction: jest.fn().mockResolvedValue("Prayagraj"),
      jurisdictionTripIds: jest.fn().mockResolvedValue(["trip-1"]),
      incidentBreakdown: jest.fn().mockResolvedValue({
        byStatus: [{ status: "OPEN", _count: { _all: 2 } }],
        bySeverity: [],
        bySource: [],
        timingRows: [
          {
            id: "incident-1",
            createdAt: new Date("2026-08-20T10:00:00Z"),
            startedAt: new Date("2026-08-20T10:01:00Z"),
            acknowledgedAt: null,
            resolvedAt: null,
          },
          {
            id: "incident-2",
            createdAt: new Date("2026-08-21T10:00:00Z"),
            startedAt: new Date("2026-08-21T10:06:00Z"),
            acknowledgedAt: null,
            resolvedAt: null,
          },
        ],
      }),
      dispatchBreakdown: jest.fn().mockResolvedValue({
        byStatus: [],
        byUnitType: [],
        timingRows: [],
      }),
    };

    const service = createAnalyticsService({ repository });
    const actor = { id: "dm-1", role: "DISASTER_MANAGER" };
    const range = {
      from: new Date("2026-08-20T00:00:00Z"),
      to: new Date("2026-08-21T23:59:59Z"),
    };

    const incidents = await service.incidents(actor, range);
    const response = await service.responseTimes(actor, range);

    expect(incidents.jurisdiction).toBe("Prayagraj");
    expect(incidents.dailyVolume).toEqual([
      { date: "2026-08-20", count: 1 },
      { date: "2026-08-21", count: 1 },
    ]);

    expect(response.incidents.distribution).toEqual([
      expect.objectContaining({ key: "UNDER_2", count: 1, percentage: 50 }),
      expect.objectContaining({ key: "TWO_TO_FIVE", count: 0, percentage: 0 }),
      expect.objectContaining({ key: "FIVE_TO_TEN", count: 1, percentage: 50 }),
      expect.objectContaining({ key: "OVER_10", count: 0, percentage: 0 }),
    ]);
    expect(response.incidents.slaUnderFiveMinutesPercent).toBe(50);
  });
});
