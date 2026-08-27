import { ApiError } from "../../common/errors/ApiError.js";
import { logger } from "../../config/logger.js";
import { tripRepository } from "./trip.repository.js";
import { credentialService } from "../credential/credential.service.js";
import { safetyService } from "../safety/safety.service.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";

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
  groupMemberCount: trip.group?.members?.length ?? (trip.tripType === "SOLO" ? 1 : 0),
  incidentCount: trip.incidentCount ?? 0,
  actualDurationMinutes:
    trip.startedAt && (trip.endedAt || trip.cancelledAt)
      ? Math.max(
          0,
          Math.round(
            (new Date(trip.endedAt || trip.cancelledAt).getTime() -
              new Date(trip.startedAt).getTime()) /
              60_000,
          ),
        )
      : null,
  plannedDurationMinutes: Math.max(
    0,
    Math.round(
      (new Date(trip.plannedEndAt).getTime() -
        new Date(trip.plannedStartAt).getTime()) /
        60_000,
    ),
  ),
  completedEarly:
    trip.status === "COMPLETED" &&
    trip.endedAt &&
    new Date(trip.endedAt) < new Date(trip.plannedEndAt),
  earlyByMinutes:
    trip.status === "COMPLETED" &&
    trip.endedAt &&
    new Date(trip.endedAt) < new Date(trip.plannedEndAt)
      ? Math.max(
          0,
          Math.round(
            (new Date(trip.plannedEndAt).getTime() -
              new Date(trip.endedAt).getTime()) /
              60_000,
          ),
        )
      : 0,
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
  if (!tourist.dateOfBirth) {
    throw ApiError.badRequest("Date of birth is required before creating a trip", { code: "DATE_OF_BIRTH_REQUIRED" });
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

export const createTripService = ({
  repository = tripRepository,
  clock = () => new Date(),
  safetyEvaluator = safetyService,
  publisher = realtimePublisher,
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
      await credentialService.ensureIndividual(trip.id, userId);
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
      const incidentCounts = await repository.historyIncidentCounts(
        trips.map((trip) => trip.id),
      );

      return {
        items: trips.map((trip) =>
          serializeTrip(
            {
              ...trip,
              incidentCount: incidentCounts.get(trip.id) ?? 0,
            },
            clock(),
          ),
        ),
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
      if (!allRequiredConsentsGranted(trip)) {
        throw ApiError.badRequest("Required trip consents must be granted first", {
          code: "TRIP_CONSENT_REQUIRED",
          details: { required: REQUIRED_CONSENTS },
        });
      }
      return credentialService.ensureIndividual(tripId, userId);
    },

    async startTrip(userId, tripId, startLocation = {}) {
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
      const credential = await credentialService.ensureIndividual(trip.id, userId);
      if (!credential.active) {
        throw ApiError.badRequest("An active, unexpired digital credential is required before start", {
          code: "SAFETY_ID_REQUIRED",
        });
      }

      const updated = await repository.startTrip(trip.id, now);

      if (
        safetyEvaluator &&
        Number.isFinite(startLocation.latitude) &&
        Number.isFinite(startLocation.longitude)
      ) {
        try {
          await safetyEvaluator.evaluateLocation({
            tripId: trip.id,
            userId,
            pingId: null,
            latitude: startLocation.latitude,
            longitude: startLocation.longitude,
            capturedAt: startLocation.capturedAt ?? now.toISOString(),
          });

          // A group has a 500 m operational safety boundary. Trigger the same
          // safety-alert -> incident ingestion pipeline immediately when that
          // boundary overlaps a risk zone, even if the leader's exact GPS point
          // is just outside the zone itself.
          if (trip.tripType === "GROUP") {
            await safetyEvaluator.evaluateGroupBoundary({
              tripId: trip.id,
              userId,
              latitude: startLocation.latitude,
              longitude: startLocation.longitude,
              radiusM: 500,
              capturedAt: startLocation.capturedAt ?? now.toISOString(),
            });
          }
        } catch (error) {
          logger.error(
            { err: error, tripId: trip.id, userId },
            "Immediate danger-zone evaluation on trip start failed",
          );
        }
      }

      await repository.createAudit({
        actorId: userId,
        action: "TRIP_STARTED",
        entityId: trip.id,
        metadata: { startedAt: now.toISOString() },
      });
      return serializeTrip(updated, now);
    },

    async extendTrip(userId, tripId, plannedEndAtInput) {
      const trip = await requireTrip(repository, tripId, userId);
      if (trip.status !== "ACTIVE") {
        throw ApiError.conflict("Only an active trip can be extended", {
          code: "TRIP_NOT_ACTIVE",
        });
      }

      const now = clock();
      const plannedEndAt = new Date(plannedEndAtInput);
      const currentEnd = new Date(trip.plannedEndAt);

      if (plannedEndAt <= now) {
        throw ApiError.badRequest("The extended end time must be in the future", {
          code: "TRIP_EXTENSION_IN_PAST",
        });
      }

      if (plannedEndAt <= currentEnd) {
        throw ApiError.badRequest("The new end time must be later than the current trip end time", {
          code: "TRIP_EXTENSION_NOT_LATER",
        });
      }

      const maximumEnd = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
      if (plannedEndAt > maximumEnd) {
        throw ApiError.badRequest("A trip can be extended by at most 24 hours at a time", {
          code: "TRIP_EXTENSION_TOO_LONG",
        });
      }

      const updated = await repository.extendTrip(trip.id, plannedEndAt);
      await credentialService.extendTrip(trip.id, plannedEndAt);
      await repository.createAudit({
        actorId: userId,
        action: "TRIP_EXTENDED",
        entityId: trip.id,
        metadata: {
          previousPlannedEndAt: currentEnd.toISOString(),
          plannedEndAt: plannedEndAt.toISOString(),
        },
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
      const expired = await repository.expireSafetyState(trip.id, now, "completed");
      const updated = await repository.completeTrip(trip.id, now);
      for (const incidentId of expired.incidentIds) {
        publisher.publishIncidentUpdated?.({ id: incidentId, tripId: trip.id, userId }, {
          type: "EXPIRED",
          source: "TRIP_COMPLETED",
        });
      }
      await credentialService.revokeTrip(trip.id, 1);
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
      const expired = await repository.expireSafetyState(trip.id, now, "cancelled");
      const updated = await repository.cancelTrip(trip.id, now);
      for (const incidentId of expired.incidentIds) {
        publisher.publishIncidentUpdated?.({ id: incidentId, tripId: trip.id, userId }, {
          type: "EXPIRED",
          source: "TRIP_CANCELLED",
        });
      }
      await credentialService.revokeTrip(trip.id, 3);
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
