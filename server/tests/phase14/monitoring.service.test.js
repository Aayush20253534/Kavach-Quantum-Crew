import { jest } from "@jest/globals";
import { createMonitoringService } from "../../src/modules/monitoring/monitoring.service.js";

const tourist = { id: "11111111-1111-4111-8111-111111111111", role: "TOURIST" };
const now = new Date("2026-08-21T18:00:00Z");
const baseTrip = {
  id: "22222222-2222-4222-8222-222222222222",
  touristId: tourist.id,
  status: "ACTIVE",
  plannedEndAt: new Date("2026-08-21T20:00:00Z"),
  monitoringPolicy: null,
  group: null,
};

const setup = (overrides = {}, trip = baseTrip) => {
  const repository = {
    findTrip: jest.fn().mockResolvedValue(trip),
    findLatest: jest.fn().mockResolvedValue({ tripId: trip.id, userId: tourist.id, latitude: 27.7, longitude: 85.3, capturedAt: new Date("2026-08-21T17:59:00Z") }),
    listRecentLocations: jest.fn().mockResolvedValue([]),
    findOpenAlert: jest.fn().mockResolvedValue(null),
    createAlert: jest.fn().mockImplementation(async (data) => ({ id: `alert-${data.type}`, status: "OPEN", ...data })),
    resolveOpenAlert: jest.fn().mockResolvedValue({ count: 0 }),
    upsertPolicy: jest.fn().mockImplementation(async (tripId, data) => ({ id: "policy-1", tripId, ...data })),
    createAudit: jest.fn().mockResolvedValue({}),
    listActiveTrips: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  const incidentReporter = { ingestSafetyAlert: jest.fn().mockResolvedValue({}) };
  return { repository, incidentReporter, service: createMonitoringService({ repository, incidentReporter, clock: () => now }) };
};

describe("Phase 14 advanced trip monitoring", () => {
  test("detects an interrupted tracking stream", async () => {
    const { service, repository, incidentReporter } = setup({
      findLatest: jest.fn().mockResolvedValue({ latitude: 27.7, longitude: 85.3, capturedAt: new Date("2026-08-21T17:50:00Z") }),
    });
    const result = await service.evaluateParticipant(tourist, baseTrip.id);
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ type: "TRACKING_INTERRUPTION" })]));
    expect(repository.createAlert).toHaveBeenCalledWith(expect.objectContaining({ type: "TRACKING_INTERRUPTION" }));
    expect(incidentReporter.ingestSafetyAlert).toHaveBeenCalled();
  });

  test("detects trip overtime", async () => {
    const trip = { ...baseTrip, plannedEndAt: new Date("2026-08-21T17:30:00Z") };
    const { service } = setup({}, trip);
    const result = await service.evaluateParticipant(tourist, trip.id);
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ type: "TRIP_OVERTIME" })]));
  });

  test("detects prolonged inactivity within the configured radius", async () => {
    const { service } = setup({
      listRecentLocations: jest.fn().mockResolvedValue([
        { latitude: 27.7, longitude: 85.3, capturedAt: new Date("2026-08-21T17:45:00Z") },
        { latitude: 27.70005, longitude: 85.30005, capturedAt: new Date("2026-08-21T18:00:00Z") },
      ]),
    });
    const result = await service.evaluateParticipant(tourist, baseTrip.id);
    expect(result.findings).toEqual(expect.arrayContaining([expect.objectContaining({ type: "INACTIVITY" })]));
  });

  test("allows the trip owner to configure monitoring thresholds", async () => {
    const { service, repository } = setup();
    await service.updatePolicy(tourist, baseTrip.id, { groupSeparationM: 750 });
    expect(repository.upsertPolicy).toHaveBeenCalledWith(baseTrip.id, { groupSeparationM: 750 });
    expect(repository.createAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "TRIP_MONITORING_POLICY_UPDATED" }));
  });
});
