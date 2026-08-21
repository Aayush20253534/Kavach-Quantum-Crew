import { jest } from "@jest/globals";
import { createMonitoringService } from "../../src/modules/monitoring/monitoring.service.js";

const member = { id: "11111111-1111-4111-8111-111111111111", role: "TOURIST" };
const leaderId = "22222222-2222-4222-8222-222222222222";
const trip = {
  id: "33333333-3333-4333-8333-333333333333",
  touristId: leaderId,
  status: "ACTIVE",
  plannedEndAt: new Date("2026-08-21T20:00:00Z"),
  monitoringPolicy: {
    enabled: true,
    trackingGapAfterMinutes: 5,
    inactivityAfterMinutes: 15,
    inactivityRadiusM: 50,
    groupSeparationM: 200,
    routeDeviationM: 100,
    overtimeGraceMinutes: 15,
    plannedRoute: [{ latitude: 27.7, longitude: 85.3 }, { latitude: 27.71, longitude: 85.31 }],
  },
  group: { id: "44444444-4444-4444-8444-444444444444", leaderId, members: [{ userId: member.id, role: "MEMBER" }] },
};

describe("Phase 14 group and route monitoring", () => {
  test("detects group separation and route deviation", async () => {
    const latestMember = { latitude: 27.75, longitude: 85.4, capturedAt: new Date("2026-08-21T17:59:00Z") };
    const latestLeader = { latitude: 27.7, longitude: 85.3, capturedAt: new Date("2026-08-21T17:59:00Z") };
    const repository = {
      findTrip: jest.fn().mockResolvedValue(trip),
      findLatest: jest.fn().mockImplementation(async (_tripId, userId) => userId === leaderId ? latestLeader : latestMember),
      listRecentLocations: jest.fn().mockResolvedValue([]),
      findOpenAlert: jest.fn().mockResolvedValue(null),
      createAlert: jest.fn().mockImplementation(async (data) => ({ id: `a-${data.type}`, status: "OPEN", ...data })),
      resolveOpenAlert: jest.fn().mockResolvedValue({ count: 0 }),
    };
    const service = createMonitoringService({ repository, incidentReporter: { ingestSafetyAlert: jest.fn() }, clock: () => new Date("2026-08-21T18:00:00Z") });
    const result = await service.evaluateParticipant(member, trip.id);
    expect(result.findings.map((finding) => finding.type)).toEqual(expect.arrayContaining(["GROUP_SEPARATION", "ROUTE_DEVIATION"]));
  });
});
