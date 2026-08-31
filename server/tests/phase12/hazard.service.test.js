import { jest } from "@jest/globals";
import { createHazardService } from "../../src/modules/hazard/hazard.service.js";

const tourist = { id: "11111111-1111-4111-8111-111111111111", role: "TOURIST" };
const manager = { id: "22222222-2222-4222-8222-222222222222", role: "DISASTER_MANAGER" };
const trip = { id: "55555555-5555-4555-8555-555555555555" };
const base = { id: "33333333-3333-4333-8333-333333333333", reporterId: tourist.id, reporterRole: "TOURIST", type: "FLOOD", severity: "HIGH", status: "PENDING", title: "Flood", description: "Road flooding", latitude: 27.7, longitude: 85.3 };
const incident = { id: "66666666-6666-4666-8666-666666666666", tripId: trip.id, userId: tourist.id, sourceType: "SAFETY_ALERT", severity: "DANGER", title: base.title };

const setup = (overrides = {}) => {
  const repository = {
    findActiveTripForTourist: jest.fn().mockResolvedValue(trip),
    createWithIncident: jest.fn().mockResolvedValue({ hazard: base, incident }),
    findById: jest.fn().mockResolvedValue(base),
    list: jest.fn().mockResolvedValue([]),
    nearby: jest.fn().mockResolvedValue([]),
    moderate: jest.fn().mockImplementation(async (_id, data) => ({ ...base, ...data })),
    createAudit: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  const publisher = { publishHazardCreated: jest.fn(), publishHazardUpdated: jest.fn(), publishIncidentCreated: jest.fn() };
  const notifier = { incidentCreated: jest.fn().mockResolvedValue(undefined) };
  return { repository, publisher, notifier, service: createHazardService({ repository, publisher, notifier, clock: () => new Date("2026-08-21T18:00:00Z") }) };
};

describe("Phase 12 hazard service", () => {
  test("turns an in-trip tourist report into a normal incident", async () => {
    const { service, repository, publisher, notifier } = setup();
    await service.create(tourist, { type: "FLOOD", severity: "HIGH", title: "Flood", description: "Road flooding", latitude: 27.7, longitude: 85.3 });
    expect(repository.findActiveTripForTourist).toHaveBeenCalledWith(tourist.id);
    expect(repository.createWithIncident).toHaveBeenCalledWith(expect.objectContaining({ tripId: trip.id, reporterId: tourist.id, type: "FLOOD" }));
    expect(publisher.publishHazardCreated).toHaveBeenCalledWith(base);
    expect(publisher.publishIncidentCreated).toHaveBeenCalledWith(incident);
    expect(notifier.incidentCreated).toHaveBeenCalledWith(incident);
  });

  test("rejects manual incident reports when the tourist has no active trip", async () => {
    const { service, repository } = setup({ findActiveTripForTourist: jest.fn().mockResolvedValue(null) });
    await expect(service.create(tourist, { type: "FLOOD", severity: "HIGH", title: "Flood", description: "Road flooding", latitude: 27.7, longitude: 85.3 })).rejects.toMatchObject({ code: "HAZARD_ACTIVE_TRIP_REQUIRED" });
    expect(repository.createWithIncident).not.toHaveBeenCalled();
  });

  test("prevents non tourists from submitting hazards", async () => {
    const { service } = setup();
    await expect(service.create(manager, { type: "FLOOD", severity: "HIGH", title: "Flood", description: "Road flooding", latitude: 27.7, longitude: 85.3 })).rejects.toMatchObject({ code: "HAZARD_REPORT_FORBIDDEN" });
  });

  test("allows disaster management to verify a pending hazard", async () => {
    const { service, repository, publisher } = setup();
    const result = await service.verify(manager, base.id, "Confirmed by field team");
    expect(result.status).toBe("VERIFIED");
    expect(repository.createAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "HAZARD_VERIFIED" }));
    expect(publisher.publishHazardUpdated).toHaveBeenCalled();
  });

  test("rejects invalid moderation transitions", async () => {
    const { service } = setup({ findById: jest.fn().mockResolvedValue({ ...base, status: "REJECTED" }) });
    await expect(service.verify(manager, base.id)).rejects.toMatchObject({ code: "HAZARD_STATE_CONFLICT" });
  });

  test("returns only nearby verified hazards within the exact radius", async () => {
    const { service } = setup({ nearby: jest.fn().mockResolvedValue([{ ...base, status: "VERIFIED", latitude: 27.7005, longitude: 85.3005 }, { ...base, id: "44444444-4444-4444-8444-444444444444", status: "VERIFIED", latitude: 28.5, longitude: 86.5 }]) });
    const result = await service.nearby(tourist, { latitude: 27.7, longitude: 85.3, radiusKm: 10, limit: 50 });
    expect(result).toHaveLength(1);
    expect(result[0].distanceKm).toBeLessThan(1);
  });
});
