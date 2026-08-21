import { jest } from "@jest/globals";

import { createAnalyticsService } from "../../src/modules/analytics/analytics.service.js";

const admin = { id: "admin-1", role: "SYSTEM_ADMIN" };
const manager = { id: "dm-1", role: "DISASTER_MANAGER" };

const countRow = (key, value, count) => ({
  [key]: value,
  _count: { _all: count },
});

describe("Phase 19 analytics service", () => {
  test("returns platform overview for emergency staff", async () => {
    const range = {
      from: new Date("2026-08-01T00:00:00.000Z"),
      to: new Date("2026-08-22T00:00:00.000Z"),
    };

    const overview = {
      tourists: 40,
      activeTrips: 7,
      openIncidents: 3,
      criticalIncidents: 1,
      pendingHazards: 2,
      activeDispatches: 1,
      sosRequests: 5,
    };

    const repository = {
      overview: jest.fn().mockResolvedValue(overview),
    };

    const service = createAnalyticsService({ repository });

    await expect(service.overview(admin, range)).resolves.toEqual(overview);
    expect(repository.overview).toHaveBeenCalledWith(range);
  });

  test("aggregates incident dimensions and ignores incomplete timing rows", async () => {
    const repository = {
      incidentBreakdown: jest.fn().mockResolvedValue({
        byStatus: [
          countRow("status", "OPEN", 2),
          countRow("status", "RESOLVED", 3),
        ],
        bySeverity: [
          countRow("severity", "HIGH", 2),
          countRow("severity", "CRITICAL", 1),
        ],
        bySource: [
          countRow("sourceType", "SOS", 4),
          countRow("sourceType", "SAFETY_ALERT", 1),
        ],
        timingRows: [
          {
            createdAt: new Date("2026-08-22T00:00:00.000Z"),
            acknowledgedAt: new Date("2026-08-22T00:05:00.000Z"),
            startedAt: new Date("2026-08-22T00:10:00.000Z"),
            resolvedAt: new Date("2026-08-22T00:30:00.000Z"),
          },
          {
            createdAt: new Date("2026-08-22T01:00:00.000Z"),
            acknowledgedAt: new Date("2026-08-22T01:15:00.000Z"),
            startedAt: null,
            resolvedAt: null,
          },
        ],
      }),
    };

    const service = createAnalyticsService({ repository });
    const result = await service.incidents(manager, {});

    expect(result.byStatus).toEqual({ OPEN: 2, RESOLVED: 3 });
    expect(result.bySeverity).toEqual({ HIGH: 2, CRITICAL: 1 });
    expect(result.bySource).toEqual({ SOS: 4, SAFETY_ALERT: 1 });
    expect(result.responseTimesMinutes).toEqual({
      acknowledge: 10,
      responseStart: 10,
      resolution: 30,
    });
  });

  test("returns null timing averages when no completed timing samples exist", async () => {
    const repository = {
      dispatchBreakdown: jest.fn().mockResolvedValue({
        byStatus: [countRow("status", "REQUESTED", 2)],
        byUnitType: [countRow("requestedUnitType", "AMBULANCE", 2)],
        timingRows: [
          {
            requestedAt: new Date("2026-08-22T00:00:00.000Z"),
            assignedAt: null,
            dispatchedAt: null,
            onSceneAt: null,
            completedAt: null,
          },
        ],
      }),
    };

    const service = createAnalyticsService({ repository });
    const result = await service.dispatch(admin, {});

    expect(result.byStatus).toEqual({ REQUESTED: 2 });
    expect(result.byUnitType).toEqual({ AMBULANCE: 2 });
    expect(result.responseTimesMinutes).toEqual({
      assignment: null,
      dispatch: null,
      onScene: null,
      completion: null,
    });
  });

  test("summarizes responder workload", async () => {
    const repository = {
      responderWorkload: jest.fn().mockResolvedValue({
        byAvailability: [
          countRow("responderStatus", "AVAILABLE", 3),
          countRow("responderStatus", "BUSY", 2),
        ],
        activeAssignments: [
          {
            assignedToId: "dm-1",
            _count: { _all: 2 },
          },
          {
            assignedToId: "dm-2",
            _count: { _all: 1 },
          },
        ],
      }),
    };

    const service = createAnalyticsService({ repository });
    const result = await service.responders(manager);

    expect(result).toEqual({
      byAvailability: {
        AVAILABLE: 3,
        BUSY: 2,
      },
      activeAssignments: [
        { responderId: "dm-1", activeIncidents: 2 },
        { responderId: "dm-2", activeIncidents: 1 },
      ],
      totalActiveAssignments: 3,
    });
  });

  test("returns consolidated incident and dispatch response times", async () => {
    const repository = {
      incidentBreakdown: jest.fn().mockResolvedValue({
        byStatus: [],
        bySeverity: [],
        bySource: [],
        timingRows: [
          {
            createdAt: new Date("2026-08-22T00:00:00.000Z"),
            acknowledgedAt: new Date("2026-08-22T00:04:00.000Z"),
            startedAt: new Date("2026-08-22T00:09:00.000Z"),
            resolvedAt: new Date("2026-08-22T00:24:00.000Z"),
          },
        ],
      }),
      dispatchBreakdown: jest.fn().mockResolvedValue({
        byStatus: [],
        byUnitType: [],
        timingRows: [
          {
            requestedAt: new Date("2026-08-22T00:00:00.000Z"),
            assignedAt: new Date("2026-08-22T00:03:00.000Z"),
            dispatchedAt: new Date("2026-08-22T00:05:00.000Z"),
            onSceneAt: new Date("2026-08-22T00:12:00.000Z"),
            completedAt: new Date("2026-08-22T00:40:00.000Z"),
          },
        ],
      }),
    };

    const service = createAnalyticsService({ repository });

    await expect(service.responseTimes(admin, {})).resolves.toEqual({
      incidents: {
        acknowledgeMinutes: 4,
        responseStartMinutes: 9,
        resolutionMinutes: 24,
      },
      dispatch: {
        assignmentMinutes: 3,
        onSceneMinutes: 12,
        completionMinutes: 40,
      },
    });
  });
});
