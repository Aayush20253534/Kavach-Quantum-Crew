import { jest } from "@jest/globals";
import { createTrackingService } from "../../src/modules/tracking/tracking.service.js";

const now = new Date("2026-08-21T10:00:00.000Z");
const ownerTrip = {
  id: "t1",
  touristId: "u1",
  status: "ACTIVE",
  consents: [{ type: "LOCATION_TRACKING", status: "GRANTED", revokedAt: null }],
  group: null,
};

const repo = () => ({
  findTripContext: jest.fn(),
  findParticipantConsent: jest.fn(),
  upsertParticipantConsent: jest.fn(),
  revokeParticipantConsent: jest.fn(),
  findLatest: jest.fn(),
  findDuplicate: jest.fn(),
  createPingAndUpdateLatest: jest.fn(),
  findGroup: jest.fn(),
  listLatestForUsers: jest.fn(),
  createAudit: jest.fn().mockResolvedValue({}),
});

const publisher = () => ({ publishLocationUpdated: jest.fn() });

const ping = (overrides = {}) => ({
  tripId: "t1",
  latitude: 25.4358,
  longitude: 81.8463,
  accuracyM: 10,
  timestamp: "2026-08-21T09:59:55.000Z",
  ...overrides,
});

describe("Phase 6 tracking service", () => {
  test("accepts and publishes a trusted owner location", async () => {
    const r = repo();
    const p = publisher();
    r.findTripContext.mockResolvedValue(ownerTrip);
    r.findDuplicate.mockResolvedValue(null);
    r.findLatest.mockResolvedValue(null);
    r.createPingAndUpdateLatest.mockResolvedValue({
      id: "p1",
      tripId: "t1",
      userId: "u1",
      latitude: 25.4358,
      longitude: 81.8463,
      accuracyM: 10,
      capturedAt: new Date("2026-08-21T09:59:55.000Z"),
      trustStatus: "TRUSTED",
    });
    const service = createTrackingService({ repository: r, publisher: p, clock: () => now });
    const result = await service.submitPing("u1", ping());
    expect(result.trustStatus).toBe("TRUSTED");
    expect(r.createPingAndUpdateLatest).toHaveBeenCalledTimes(1);
    expect(p.publishLocationUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ tripId: "t1", userId: "u1" }),
    );
  });

  test("rejects tracking when trip is not active", async () => {
    const r = repo();
    r.findTripContext.mockResolvedValue({ ...ownerTrip, status: "PLANNED" });
    const service = createTrackingService({ repository: r, clock: () => now });
    await expect(service.submitPing("u1", ping())).rejects.toMatchObject({ code: "TRIP_TRACKING_NOT_ACTIVE" });
  });

  test("requires explicit consent for a group member", async () => {
    const r = repo();
    r.findTripContext.mockResolvedValue({
      ...ownerTrip,
      touristId: "leader",
      group: { id: "g1", members: [{ userId: "u1" }] },
    });
    r.findParticipantConsent.mockResolvedValue(null);
    const service = createTrackingService({ repository: r, clock: () => now });
    await expect(service.submitPing("u1", ping())).rejects.toMatchObject({
      code: "LOCATION_TRACKING_CONSENT_REQUIRED",
    });
  });

  test("rejects stale GPS points", async () => {
    const r = repo();
    r.findTripContext.mockResolvedValue(ownerTrip);
    const service = createTrackingService({ repository: r, clock: () => now });
    await expect(
      service.submitPing("u1", ping({ timestamp: "2026-08-21T09:50:00.000Z" })),
    ).rejects.toMatchObject({ code: "LOCATION_STALE" });
  });

  test("rejects physically impossible jumps", async () => {
    const r = repo();
    r.findTripContext.mockResolvedValue(ownerTrip);
    r.findDuplicate.mockResolvedValue(null);
    r.findLatest.mockResolvedValue({
      latitude: 25.4358,
      longitude: 81.8463,
      capturedAt: new Date("2026-08-21T09:59:50.000Z"),
    });
    const service = createTrackingService({ repository: r, clock: () => now });
    await expect(
      service.submitPing("u1", ping({ latitude: 26.0, longitude: 82.5 })),
    ).rejects.toMatchObject({ code: "LOCATION_IMPOSSIBLE_JUMP" });
  });

  test("only active group members can view group locations", async () => {
    const r = repo();
    r.findGroup.mockResolvedValue({
      id: "g1",
      tripId: "t1",
      trip: { id: "t1", status: "ACTIVE" },
      members: [{ id: "m1", userId: "u2", role: "MEMBER", user: { id: "u2" } }],
    });
    const service = createTrackingService({ repository: r, clock: () => now });
    await expect(service.getGroupLocations("u1", "g1")).rejects.toMatchObject({
      code: "GROUP_MEMBERSHIP_REQUIRED",
    });
  });
});
