import { jest } from "@jest/globals";

import { createTripService } from "../../src/modules/trip/trip.service.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const TRIP_ID = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-08-24T04:00:00.000Z");

describe("trip extension and history summary", () => {
  test("extends an active trip and keeps its Safety ID expiry aligned", async () => {
    const trip = {
      id: TRIP_ID,
      touristId: USER_ID,
      locationName: "Prayagraj",
      tripType: "SOLO",
      status: "ACTIVE",
      plannedStartAt: new Date("2026-08-24T03:00:00.000Z"),
      plannedEndAt: new Date("2026-08-24T05:00:00.000Z"),
      startedAt: new Date("2026-08-24T03:00:00.000Z"),
      safetyId: {
        id: "33333333-3333-4333-8333-333333333333",
        publicId: "STS-test",
        issuedAt: NOW,
        expiresAt: new Date("2026-08-24T05:00:00.000Z"),
        revokedAt: null,
      },
      consents: [],
      group: null,
    };

    const repository = {
      findByIdForTourist: jest.fn().mockResolvedValue(trip),
      extendTrip: jest.fn().mockImplementation(async (_id, plannedEndAt) => ({
        ...trip,
        plannedEndAt,
        safetyId: { ...trip.safetyId, expiresAt: plannedEndAt },
      })),
      createAudit: jest.fn().mockResolvedValue({}),
    };

    const service = createTripService({ repository, clock: () => NOW });
    const result = await service.extendTrip(
      USER_ID,
      TRIP_ID,
      "2026-08-24T06:00:00.000Z",
    );

    expect(repository.extendTrip).toHaveBeenCalledWith(
      TRIP_ID,
      new Date("2026-08-24T06:00:00.000Z"),
    );
    expect(result.plannedEndAt).toEqual(new Date("2026-08-24T06:00:00.000Z"));
  });

  test("history includes actual duration, early completion and incident counts", async () => {
    const repository = {
      listHistory: jest.fn().mockResolvedValue([
        {
          id: TRIP_ID,
          touristId: USER_ID,
          locationName: "Prayagraj",
          tripType: "GROUP",
          status: "COMPLETED",
          plannedStartAt: new Date("2026-08-24T01:00:00.000Z"),
          plannedEndAt: new Date("2026-08-24T05:00:00.000Z"),
          startedAt: new Date("2026-08-24T01:00:00.000Z"),
          endedAt: new Date("2026-08-24T04:00:00.000Z"),
          cancelledAt: null,
          createdAt: NOW,
          updatedAt: NOW,
          safetyId: null,
          consents: [],
          group: { members: [{ id: "m1" }, { id: "m2" }, { id: "m3" }] },
        },
      ]),
      historyIncidentCounts: jest.fn().mockResolvedValue(new Map([[TRIP_ID, 2]])),
    };

    const service = createTripService({ repository, clock: () => NOW });
    const result = await service.getHistory(USER_ID, { limit: 20 });

    expect(result.items[0]).toMatchObject({
      incidentCount: 2,
      groupMemberCount: 3,
      actualDurationMinutes: 180,
      plannedDurationMinutes: 240,
      completedEarly: true,
      earlyByMinutes: 60,
    });
  });
});
