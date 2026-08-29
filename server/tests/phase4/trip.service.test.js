import { jest } from "@jest/globals";

import { createTripService } from "../../src/modules/trip/trip.service.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const TRIP_ID = "22222222-2222-2222-2222-222222222222";
const CONSENT_1 = "33333333-3333-3333-3333-333333333333";
const CONSENT_2 = "44444444-4444-4444-4444-444444444444";
const SAFETY_RECORD = "55555555-5555-5555-5555-555555555555";
const NOW = new Date("2026-08-21T08:00:00.000Z");
const END = new Date("2026-08-22T18:00:00.000Z");

const grantedConsents = [
  {
    id: CONSENT_1,
    type: "LOCATION_TRACKING",
    status: "GRANTED",
    grantedAt: NOW,
    revokedAt: null,
  },
  {
    id: CONSENT_2,
    type: "EMERGENCY_SHARING",
    status: "GRANTED",
    grantedAt: NOW,
    revokedAt: null,
  },
];

const baseTrip = {
  id: TRIP_ID,
  touristId: USER_ID,
  locationName: "Prayagraj",
  tripType: "SOLO",
  status: "PLANNED",
  plannedStartAt: new Date("2026-08-22T09:00:00.000Z"),
  plannedEndAt: END,
  startedAt: null,
  endedAt: null,
  cancelledAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  safetyId: null,
  consents: [],
};

const audit = jest.fn().mockResolvedValue({});

const makeRepository = (overrides = {}) => ({
  findTourist: jest.fn().mockResolvedValue({ id: USER_ID, onboardingCompleted: true }),
  findCurrentTrip: jest.fn().mockResolvedValue(null),
  findByIdForTourist: jest.fn().mockResolvedValue(baseTrip),
  create: jest.fn().mockResolvedValue(baseTrip),
  attachAiPlan: jest.fn(),
  listHistory: jest.fn().mockResolvedValue([]),
  upsertConsent: jest.fn(),
  findConsentById: jest.fn(),
  revokeConsent: jest.fn(),
  upsertSafetyId: jest.fn(),
  startTrip: jest.fn(),
  completeTrip: jest.fn(),
  cancelTrip: jest.fn(),
  createAudit: audit,
  ...overrides,
});

const makeService = (repository) =>
  createTripService({
    repository,
    clock: () => NOW,
    safetyIdFactory: () => "STS-test-safe-id",
  });

describe("Phase 4 trip service", () => {
  beforeEach(() => audit.mockClear());

  test("creates one planned trip for an onboarded tourist", async () => {
    const repository = makeRepository();
    const service = makeService(repository);

    await expect(
      service.createTrip(USER_ID, {
        locationName: "Prayagraj",
        tripType: "SOLO",
        plannedStartAt: "2026-08-22T09:00:00.000Z",
        plannedEndAt: "2026-08-22T18:00:00.000Z",
      }),
    ).resolves.toMatchObject({ id: TRIP_ID, status: "PLANNED", tripType: "SOLO" });

    expect(repository.create).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        locationName: "Prayagraj",
        plannedStartAt: expect.any(Date),
        plannedEndAt: expect.any(Date),
      }),
    );
  });

  test("rejects a second current trip", async () => {
    const repository = makeRepository({ findCurrentTrip: jest.fn().mockResolvedValue(baseTrip) });
    const service = makeService(repository);

    await expect(
      service.createTrip(USER_ID, {
        locationName: "Delhi",
        tripType: "SOLO",
        plannedStartAt: "2026-08-22T09:00:00.000Z",
        plannedEndAt: "2026-08-22T18:00:00.000Z",
      }),
    ).rejects.toMatchObject({ code: "CURRENT_TRIP_EXISTS" });
  });

  test("does not issue a Safety ID before required consent", async () => {
    const repository = makeRepository();
    const service = makeService(repository);

    await expect(service.issueSafetyId(USER_ID, TRIP_ID)).rejects.toMatchObject({
      code: "TRIP_CONSENT_REQUIRED",
    });
  });

  test("issues a trip-scoped Safety ID after both consents", async () => {
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue({ ...baseTrip, consents: grantedConsents }),
      upsertSafetyId: jest.fn().mockResolvedValue({
        id: SAFETY_RECORD,
        tripId: TRIP_ID,
        publicId: "STS-test-safe-id",
        issuedAt: NOW,
        expiresAt: END,
        revokedAt: null,
      }),
    });
    const service = makeService(repository);

    await expect(service.issueSafetyId(USER_ID, TRIP_ID)).resolves.toMatchObject({
      publicId: "STS-test-safe-id",
      active: true,
    });
  });

  test("rejects AI planning for a group with fewer than two active members", async () => {
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue({
        ...baseTrip,
        tripType: "GROUP",
        group: { isLocked: false, members: [{ id: "member-1", userId: USER_ID }] },
      }),
    });
    const service = makeService(repository);

    await expect(service.attachAiPlan(USER_ID, TRIP_ID, { itinerary: {} })).rejects.toMatchObject({
      code: "GROUP_MIN_MEMBERS_REQUIRED",
    });
    expect(repository.attachAiPlan).not.toHaveBeenCalled();
  });

  test("rejects AI planning for an unlocked group even when it has two members", async () => {
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue({
        ...baseTrip,
        tripType: "GROUP",
        group: {
          isLocked: false,
          members: [
            { id: "member-1", userId: USER_ID },
            { id: "member-2", userId: "66666666-6666-6666-6666-666666666666" },
          ],
        },
      }),
    });
    const service = makeService(repository);

    await expect(service.attachAiPlan(USER_ID, TRIP_ID, { itinerary: {} })).rejects.toMatchObject({
      code: "GROUP_LOCK_REQUIRED",
    });
    expect(repository.attachAiPlan).not.toHaveBeenCalled();
  });

  test("requires an active Safety ID before starting", async () => {
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue({ ...baseTrip, consents: grantedConsents }),
    });
    const service = makeService(repository);

    await expect(service.startTrip(USER_ID, TRIP_ID)).rejects.toMatchObject({
      code: "SAFETY_ID_REQUIRED",
    });
  });

  test("rejects starting a group trip with fewer than two active members", async () => {
    const safetyId = {
      id: SAFETY_RECORD,
      publicId: "STS-test-safe-id",
      issuedAt: NOW,
      expiresAt: END,
      revokedAt: null,
    };
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue({
        ...baseTrip,
        tripType: "GROUP",
        consents: grantedConsents,
        safetyId,
        group: { members: [{ id: "member-1", userId: USER_ID }] },
      }),
    });
    const service = makeService(repository);

    await expect(service.startTrip(USER_ID, TRIP_ID)).rejects.toMatchObject({
      code: "GROUP_MIN_MEMBERS_REQUIRED",
    });
    expect(repository.startTrip).not.toHaveBeenCalled();
  });

  test("rejects starting an unlocked group even when it has two active members", async () => {
    const safetyId = {
      id: SAFETY_RECORD,
      publicId: "STS-test-safe-id",
      issuedAt: NOW,
      expiresAt: END,
      revokedAt: null,
    };
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue({
        ...baseTrip,
        tripType: "GROUP",
        consents: grantedConsents,
        safetyId,
        group: {
          isLocked: false,
          members: [
            { id: "member-1", userId: USER_ID },
            { id: "member-2", userId: "66666666-6666-6666-6666-666666666666" },
          ],
        },
      }),
    });
    const service = makeService(repository);

    await expect(service.startTrip(USER_ID, TRIP_ID)).rejects.toMatchObject({
      code: "GROUP_LOCK_REQUIRED",
    });
    expect(repository.startTrip).not.toHaveBeenCalled();
  });

  test("starts a planned trip after consent and Safety ID checks", async () => {
    const safetyId = {
      id: SAFETY_RECORD,
      publicId: "STS-test-safe-id",
      issuedAt: NOW,
      expiresAt: END,
      revokedAt: null,
    };
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue({
        ...baseTrip,
        consents: grantedConsents,
        safetyId,
      }),
      startTrip: jest.fn().mockResolvedValue({
        ...baseTrip,
        status: "ACTIVE",
        startedAt: NOW,
        consents: grantedConsents,
        safetyId,
      }),
    });
    const service = makeService(repository);

    await expect(service.startTrip(USER_ID, TRIP_ID)).resolves.toMatchObject({
      status: "ACTIVE",
      safetyId: { active: true },
    });
  });

  test("completes only an active trip", async () => {
    const active = { ...baseTrip, status: "ACTIVE", consents: grantedConsents };
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue(active),
      completeTrip: jest.fn().mockResolvedValue({
        ...active,
        status: "COMPLETED",
        endedAt: NOW,
        consents: grantedConsents.map((c) => ({ ...c, status: "REVOKED", revokedAt: NOW })),
      }),
    });
    const service = makeService(repository);

    await expect(service.completeTrip(USER_ID, TRIP_ID)).resolves.toMatchObject({
      status: "COMPLETED",
      endedAt: NOW,
    });
  });

  test("allows consent withdrawal during an active trip", async () => {
    const active = { ...baseTrip, status: "ACTIVE", consents: grantedConsents };
    const repository = makeRepository({
      findByIdForTourist: jest.fn().mockResolvedValue(active),
      findConsentById: jest.fn().mockResolvedValue(grantedConsents[0]),
      revokeConsent: jest.fn().mockResolvedValue({
        ...grantedConsents[0],
        status: "REVOKED",
        revokedAt: NOW,
      }),
    });
    const service = makeService(repository);

    await expect(service.revokeConsent(USER_ID, TRIP_ID, CONSENT_1)).resolves.toMatchObject({
      status: "REVOKED",
    });
  });
});
