import { jest } from "@jest/globals";
import { createSafetyService } from "../../src/modules/safety/safety.service.js";

const now = new Date("2026-08-21T10:00:00.000Z");
const activeTrip = {
  id: "t1",
  touristId: "u1",
  status: "ACTIVE",
  group: null,
};

const repository = () => ({
  findTripContext: jest.fn().mockResolvedValue(activeTrip),
  createZone: jest.fn(),
  listZones: jest.fn().mockResolvedValue([]),
  listActiveZones: jest.fn().mockResolvedValue([]),
  createCheckIn: jest.fn(),
  findCheckIn: jest.fn(),
  listCheckIns: jest.fn().mockResolvedValue([]),
  findDueCheckIns: jest.fn().mockResolvedValue([]),
  completeCheckIn: jest.fn(),
  markCheckInMissed: jest.fn(),
  findLastGeofenceEvent: jest.fn().mockResolvedValue(null),
  createGeofenceEvent: jest.fn().mockImplementation(async (data) => ({ id: "evt1", ...data })),
  findOpenAlert: jest.fn().mockResolvedValue(null),
  createAlert: jest.fn().mockImplementation(async (data) => ({ id: "a1", status: "OPEN", ...data })),
  resolveOpenAlert: jest.fn().mockResolvedValue({ count: 1 }),
  listAlerts: jest.fn().mockResolvedValue([]),
  findAlert: jest.fn(),
  acknowledgeAlert: jest.fn(),
  findLatestLocation: jest.fn().mockResolvedValue(null),
  createAudit: jest.fn().mockResolvedValue({}),
});

describe("Phase 7 deterministic safety service", () => {
  test("creates a danger alert when entering a high severity risk zone", async () => {
    const repo = repository();
    repo.listActiveZones.mockResolvedValue([
      {
        id: "z1",
        name: "Flood Area",
        type: "RISK",
        severity: "HIGH",
        latitude: 25.4358,
        longitude: 81.8463,
        radiusM: 500,
      },
    ]);
    const service = createSafetyService({ repository: repo, clock: () => now });
    const result = await service.evaluateLocation({
      tripId: "t1",
      userId: "u1",
      pingId: "p1",
      latitude: 25.4358,
      longitude: 81.8463,
      capturedAt: now,
    });

    expect(result.level).toBe("DANGER");
    expect(repo.createGeofenceEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "ENTER", zoneId: "z1" }));
    expect(repo.createAlert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "RISK_ZONE_ENTRY", level: "DANGER", sourceId: "z1" }),
    );
  });

  test("safe-zone entry creates an event without an alert", async () => {
    const repo = repository();
    repo.listActiveZones.mockResolvedValue([
      {
        id: "z2",
        name: "Police Post",
        type: "SAFE",
        severity: "LOW",
        latitude: 25.4358,
        longitude: 81.8463,
        radiusM: 200,
      },
    ]);
    const service = createSafetyService({ repository: repo, clock: () => now });
    const result = await service.evaluateLocation({
      tripId: "t1",
      userId: "u1",
      pingId: "p1",
      latitude: 25.4358,
      longitude: 81.8463,
      capturedAt: now,
    });

    expect(result.level).toBe("SAFE");
    expect(repo.createGeofenceEvent).toHaveBeenCalled();
    expect(repo.createAlert).not.toHaveBeenCalled();
  });

  test("turns overdue check-ins into one warning alert", async () => {
    const repo = repository();
    repo.findDueCheckIns.mockResolvedValue([
      { id: "c1", tripId: "t1", userId: "u1", dueAt: new Date("2026-08-21T09:55:00.000Z") },
    ]);
    repo.markCheckInMissed.mockResolvedValue({ id: "c1", status: "MISSED" });
    const service = createSafetyService({ repository: repo, clock: () => now });

    const missed = await service.processDueCheckIns("t1");

    expect(missed).toHaveLength(1);
    expect(repo.markCheckInMissed).toHaveBeenCalledWith("c1", now);
    expect(repo.createAlert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "MISSED_CHECK_IN", level: "WARNING", sourceId: "c1" }),
    );
  });

  test("schedules a future check-in for an active participant", async () => {
    const repo = repository();
    const dueAt = new Date(now.getTime() + 10 * 60_000);
    repo.createCheckIn.mockResolvedValue({ id: "c1", tripId: "t1", userId: "u1", dueAt, status: "PENDING" });
    const service = createSafetyService({ repository: repo, clock: () => now });

    const result = await service.scheduleCheckIn("u1", "t1", dueAt);

    expect(result.status).toBe("PENDING");
    expect(repo.createCheckIn).toHaveBeenCalledWith({ tripId: "t1", userId: "u1", dueAt });
  });

  test("marks stale location as a warning", async () => {
    const repo = repository();
    repo.findLatestLocation.mockResolvedValue({ capturedAt: new Date(now.getTime() - 180_000) });
    repo.listAlerts.mockResolvedValue([
      { id: "a1", type: "STALE_LOCATION", level: "WARNING", status: "OPEN" },
    ]);
    const service = createSafetyService({ repository: repo, clock: () => now });

    const result = await service.getRisk("u1", "t1");

    expect(repo.createAlert).toHaveBeenCalledWith(expect.objectContaining({ type: "STALE_LOCATION" }));
    expect(result.level).toBe("WARNING");
  });

  test("acknowledges only the tourist's own alert", async () => {
    const repo = repository();
    repo.findAlert.mockResolvedValue({ id: "a1", userId: "u1", tripId: "t1", type: "RISK_ZONE_ENTRY", status: "OPEN" });
    repo.acknowledgeAlert.mockResolvedValue({ id: "a1", status: "ACKNOWLEDGED" });
    const service = createSafetyService({ repository: repo, clock: () => now });

    const result = await service.acknowledgeAlert("u1", "a1");

    expect(result.status).toBe("ACKNOWLEDGED");
    expect(repo.acknowledgeAlert).toHaveBeenCalledWith("a1", now);
  });
});
