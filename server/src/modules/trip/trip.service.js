import crypto from "node:crypto";

import { ApiError } from "../../common/errors/ApiError.js";
import { tripRepository } from "./trip.repository.js";

const REQUIRED_CONSENTS = ["LOCATION_TRACKING", "EMERGENCY_SHARING"];

const isSafetyIdActive = (safetyId, now) =>
  Boolean(safetyId && !safetyId.revokedAt && new Date(safetyId.expiresAt) > now);

const serializeSafetyId = (safetyId, now = new Date()) =>
  safetyId
    ? {
        id: safetyId.id,
        publicId: safetyId.publicId,
        issuedAt: safetyId.issuedAt,
        expiresAt: safetyId.expiresAt,
        revokedAt: safetyId.revokedAt,
        active: isSafetyIdActive(safetyId, now),
      }
    : null;

const serializeTrip = (trip, now = new Date()) => ({
  id: trip.id,
  touristId: trip.touristId,
  locationName: trip.locationName,
  tripType: trip.tripType,
  status: trip.status,
  plannedStartAt: trip.plannedStartAt,
  plannedEndAt: trip.plannedEndAt,
  startedAt: trip.startedAt,
  endedAt: trip.endedAt,
  cancelledAt: trip.cancelledAt,
  createdAt: trip.createdAt,
  updatedAt: trip.updatedAt,
  safetyId: serializeSafetyId(trip.safetyId, now),
  consents: (trip.consents ?? []).map((consent) => ({
    id: consent.id,
    type: consent.type,
    status: consent.status,
    grantedAt: consent.grantedAt,
    revokedAt: consent.revokedAt,
  })),
});

const requireTrip = async (repository, tripId, userId) => {
  const trip = await repository.findByIdForTourist(tripId, userId);
  if (!trip) {
    throw ApiError.notFound("Trip not found", { code: "TRIP_NOT_FOUND" });
  }
  return trip;
};

const requireOnboardedTourist = async (repository, userId) => {
  const tourist = await repository.findTourist(userId);
  if (!tourist) {
    throw ApiError.notFound("Tourist account not found", { code: "TOURIST_NOT_FOUND" });
  }
  if (!tourist.onboardingCompleted) {
    throw ApiError.badRequest("Complete onboarding before creating a trip", {
      code: "ONBOARDING_REQUIRED",
    });
  }
  return tourist;
};

const allRequiredConsentsGranted = (trip) => {
  const granted = new Set(
    (trip.consents ?? [])
      .filter((consent) => consent.status === "GRANTED" && !consent.revokedAt)
      .map((consent) => consent.type),
  );
  return REQUIRED_CONSENTS.every((type) => granted.has(type));
};

const generateSafetyId = () => `STS-${crypto.randomBytes(18).toString("base64url")}`;

export const createTripService = ({
  repository = tripRepository,
  clock = () => new Date(),
  safetyIdFactory = generateSafetyId,
} = {}) =>
  Object.freeze({
    async createTrip(userId, input) {
      await requireOnboardedTourist(repository, userId);

      const current = await repository.findCurrentTrip(userId);
      if (current) {
        throw ApiError.conflict("Complete or cancel the current trip before creating another", {
          code: "CURRENT_TRIP_EXISTS",
          details: { tripId: current.id, status: current.status },
        });
      }

      const now = clock();
      const plannedStartAt = new Date(input.plannedStartAt);
      const plannedEndAt = new Date(input.plannedEndAt);
      if (plannedEndAt <= now) {
        throw ApiError.badRequest("plannedEndAt must be in the future", {
          code: "TRIP_END_IN_PAST",
        });
      }

      const trip = await repository.create(userId, {
        ...input,
        plannedStartAt,
        plannedEndAt,
      });
      await repository.createAudit({
        actorId: userId,
        action: "TRIP_CREATED",
        entityId: trip.id,
        metadata: { tripType: trip.tripType, locationName: trip.locationName },
      });
      return serializeTrip(trip, now);
    },

    async getCurrentTrip(userId) {
      const trip = await repository.findCurrentTrip(userId);
      return trip ? serializeTrip(trip, clock()) : null;
    },

    async getTrip(userId, tripId) {
      return serializeTrip(await requireTrip(repository, tripId, userId), clock());
    },

    async getHistory(userId, query) {
      const trips = await repository.listHistory(userId, query);
      return {
        items: trips.map((trip) => serializeTrip(trip, clock())),
        nextCursor: trips.length === query.limit ? trips.at(-1)?.id ?? null : null,
      };
    },

    async grantConsent(userId, tripId, type) {
      const trip = await requireTrip(repository, tripId, userId);
      if (!['PLANNED', 'ACTIVE'].includes(trip.status)) {
        throw ApiError.conflict("Consent cannot be changed after the trip has ended", {
          code: "TRIP_NOT_OPEN",
        });
      }

      const now = clock();
      const consent = await repository.upsertConsent(tripId, type, now);
      await repository.createAudit({
        actorId: userId,
        action: "TRIP_CONSENT_GRANTED",
        entityId: tripId,
        metadata: { consentId: consent.id, type },
      });
      return consent;
    },

    async revokeConsent(userId, tripId, consentId) {
      const trip = await requireTrip(repository, tripId, userId);
      if (!['PLANNED', 'ACTIVE'].includes(trip.status)) {
        throw ApiError.conflict("Consent cannot be changed after the trip has ended", {
          code: "TRIP_NOT_OPEN",
        });
      }

      const consent = await repository.findConsentById(tripId, consentId);
      if (!consent) {
        throw ApiError.notFound("Consent not found", { code: "CONSENT_NOT_FOUND" });
      }
      if (consent.status === "REVOKED") return consent;

      const now = clock();
      const revoked = await repository.revokeConsent(consentId, now);
      await repository.createAudit({
        actorId: userId,
        action: "TRIP_CONSENT_REVOKED",
        entityId: tripId,
        metadata: { consentId, type: consent.type },
      });
      return revoked;
    },

    async issueSafetyId(userId, tripId) {
      const trip = await requireTrip(repository, tripId, userId);
      if (trip.status !== "PLANNED") {
        throw ApiError.conflict("Safety ID can only be issued for a planned trip", {
          code: "TRIP_NOT_PLANNED",
        });
      }
      if (!allRequiredConsentsGranted(trip)) {
        throw ApiError.badRequest("Required trip consents must be granted first", {
          code: "TRIP_CONSENT_REQUIRED",
          details: { required: REQUIRED_CONSENTS },
        });
      }

      const now = clock();
      if (trip.plannedEndAt <= now) {
        throw ApiError.badRequest("Cannot issue a Safety ID for an expired trip window", {
          code: "TRIP_WINDOW_EXPIRED",
        });
      }
      if (isSafetyIdActive(trip.safetyId, now)) {
        return serializeSafetyId(trip.safetyId, now);
      }

      const safetyId = await repository.upsertSafetyId(trip.id, {
        publicId: safetyIdFactory(),
        expiresAt: trip.plannedEndAt,
        now,
      });
      await repository.createAudit({
        actorId: userId,
        action: "TRIP_SAFETY_ID_ISSUED",
        entityId: trip.id,
        metadata: {
          safetyIdRecordId: safetyId.id,
          expiresAt: new Date(safetyId.expiresAt).toISOString(),
        },
      });
      return serializeSafetyId(safetyId, now);
    },

    async startTrip(userId, tripId) {
      const trip = await requireTrip(repository, tripId, userId);
      if (trip.status !== "PLANNED") {
        throw ApiError.conflict("Only a planned trip can be started", {
          code: "TRIP_NOT_PLANNED",
        });
      }
      if (!allRequiredConsentsGranted(trip)) {
        throw ApiError.badRequest("Required trip consents must be granted before start", {
          code: "TRIP_CONSENT_REQUIRED",
          details: { required: REQUIRED_CONSENTS },
        });
      }
      if (trip.tripType === "GROUP" && (trip.group?.members?.length ?? 0) < 2) {
        throw ApiError.badRequest("A group trip requires at least 2 active members before start", {
          code: "GROUP_MIN_MEMBERS_REQUIRED",
          details: { minimumMembers: 2, activeMembers: trip.group?.members?.length ?? 0 },
        });
      }

      const now = clock();
      if (!isSafetyIdActive(trip.safetyId, now)) {
        throw ApiError.badRequest("An active, unexpired Safety ID is required before start", {
          code: "SAFETY_ID_REQUIRED",
        });
      }

      const updated = await repository.startTrip(trip.id, now);
      await repository.createAudit({
        actorId: userId,
        action: "TRIP_STARTED",
        entityId: trip.id,
        metadata: { startedAt: now.toISOString() },
      });
      return serializeTrip(updated, now);
    },

    async completeTrip(userId, tripId) {
      const trip = await requireTrip(repository, tripId, userId);
      if (trip.status !== "ACTIVE") {
        throw ApiError.conflict("Only an active trip can be completed", {
          code: "TRIP_NOT_ACTIVE",
        });
      }
      const now = clock();
      const updated = await repository.completeTrip(trip.id, now);
      await repository.createAudit({
        actorId: userId,
        action: "TRIP_COMPLETED",
        entityId: trip.id,
        metadata: { endedAt: now.toISOString() },
      });
      return serializeTrip(updated, now);
    },

    async cancelTrip(userId, tripId) {
      const trip = await requireTrip(repository, tripId, userId);
      if (!["PLANNED", "ACTIVE"].includes(trip.status)) {
        throw ApiError.conflict("Only a planned or active trip can be cancelled", {
          code: "TRIP_NOT_OPEN",
        });
      }
      const now = clock();
      const updated = await repository.cancelTrip(trip.id, now);
      await repository.createAudit({
        actorId: userId,
        action: "TRIP_CANCELLED",
        entityId: trip.id,
        metadata: { cancelledAt: now.toISOString(), previousStatus: trip.status },
      });
      return serializeTrip(updated, now);
    },
  });

export const tripService = createTripService();
export default tripService;
