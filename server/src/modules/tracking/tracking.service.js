import { ApiError } from "../../common/errors/ApiError.js";
import { haversineDistanceM } from "../../common/utils/geo.js";
import { locationPublisher } from "../../realtime/locationPublisher.js";
import { safetyService } from "../safety/safety.service.js";
import { trackingRepository } from "./tracking.repository.js";

export const TRACKING_LIMITS = Object.freeze({
  maxAccuracyM: 100,
  maxAgeMs: 120_000,
  maxFutureSkewMs: 30_000,
  minIntervalMs: 2_000,
  maxCalculatedSpeedMps: 80,
  staleAfterMs: 120_000,
});

const isParticipant = (trip, userId) =>
  trip.touristId === userId ||
  Boolean(
    trip.group?.members?.some(
      (member) => member.userId === userId,
    ),
  );

const hasOwnerLocationConsent = (trip) =>
  (trip.consents ?? []).some(
    (consent) =>
      consent.type === "LOCATION_TRACKING" &&
      consent.status === "GRANTED" &&
      !consent.revokedAt,
  );

const requireParticipant = async (
  repository,
  tripId,
  userId,
  allowedStatuses = ["ACTIVE"],
) => {
  const trip = await repository.findTripContext(
    tripId,
    userId,
  );

  if (!trip || !isParticipant(trip, userId)) {
    throw ApiError.notFound("Trip not found", {
      code: "TRIP_NOT_FOUND",
    });
  }

  if (!allowedStatuses.includes(trip.status)) {
    throw ApiError.conflict(
      "Trip is not in a tracking-compatible state",
      {
        code: "TRIP_TRACKING_NOT_ACTIVE",
        details: {
          status: trip.status,
        },
      },
    );
  }

  return trip;
};

const requireTrackingConsent = async (
  repository,
  trip,
  userId,
) => {
  if (
    trip.touristId === userId &&
    hasOwnerLocationConsent(trip)
  ) {
    return;
  }

  const consent =
    await repository.findParticipantConsent(
      trip.id,
      userId,
    );

  if (!consent || consent.revokedAt) {
    throw ApiError.forbidden(
      "Location tracking consent is required",
      {
        code: "LOCATION_TRACKING_CONSENT_REQUIRED",
      },
    );
  }
};

const serializeLocation = (
  location,
  now = new Date(),
) =>
  location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracyM: location.accuracyM,
        capturedAt: location.capturedAt,
        stale:
          now.getTime() -
            new Date(location.capturedAt).getTime() >
          TRACKING_LIMITS.staleAfterMs,
      }
    : null;

export const createTrackingService = ({
  repository = trackingRepository,
  publisher = locationPublisher,
  clock = () => new Date(),
  limits = TRACKING_LIMITS,
  safetyEvaluator = null,
} = {}) =>
  Object.freeze({
    async grantConsent(userId, tripId) {
      const trip = await requireParticipant(
        repository,
        tripId,
        userId,
        ["PLANNED", "ACTIVE"],
      );

      if (
        trip.touristId === userId &&
        hasOwnerLocationConsent(trip)
      ) {
        return {
          tripId,
          userId,
          source: "TRIP_CONSENT",
          granted: true,
          revokedAt: null,
        };
      }

      const consent =
        await repository.upsertParticipantConsent(
          tripId,
          userId,
          clock(),
        );

      await repository.createAudit({
        actorId: userId,
        action: "TRACKING_CONSENT_GRANTED",
        entityId: tripId,
        metadata: {
          participantId: userId,
        },
      });

      return consent;
    },

    async revokeConsent(userId, tripId) {
      const trip = await requireParticipant(
        repository,
        tripId,
        userId,
        ["PLANNED", "ACTIVE"],
      );

      if (trip.touristId === userId) {
        throw ApiError.badRequest(
          "Trip owner must revoke LOCATION_TRACKING through trip consent",
          {
            code: "USE_TRIP_CONSENT_ENDPOINT",
          },
        );
      }

      const consent =
        await repository.findParticipantConsent(
          tripId,
          userId,
        );

      if (!consent) {
        throw ApiError.notFound(
          "Tracking consent not found",
          {
            code: "TRACKING_CONSENT_NOT_FOUND",
          },
        );
      }

      if (consent.revokedAt) {
        return consent;
      }

      const revoked =
        await repository.revokeParticipantConsent(
          tripId,
          userId,
          clock(),
        );

      await repository.createAudit({
        actorId: userId,
        action: "TRACKING_CONSENT_REVOKED",
        entityId: tripId,
        metadata: {
          participantId: userId,
        },
      });

      return revoked;
    },

    async submitPing(userId, input) {
      const trip = await requireParticipant(
        repository,
        input.tripId,
        userId,
        ["ACTIVE"],
      );

      await requireTrackingConsent(
        repository,
        trip,
        userId,
      );

      const now = clock();
      const capturedAt = new Date(input.timestamp);

      const ageMs =
        now.getTime() - capturedAt.getTime();

      if (ageMs > limits.maxAgeMs) {
        throw ApiError.badRequest(
          "Location point is stale",
          {
            code: "LOCATION_STALE",
          },
        );
      }

      if (ageMs < -limits.maxFutureSkewMs) {
        throw ApiError.badRequest(
          "Location timestamp is too far in the future",
          {
            code: "LOCATION_FUTURE_TIMESTAMP",
          },
        );
      }

      if (input.accuracyM > limits.maxAccuracyM) {
        throw ApiError.badRequest(
          "Location accuracy is too low",
          {
            code: "LOCATION_ACCURACY_TOO_LOW",
            details: {
              maxAccuracyM: limits.maxAccuracyM,
            },
          },
        );
      }

      if (
        input.speedMps !== null &&
        input.speedMps !== undefined &&
        input.speedMps >
          limits.maxCalculatedSpeedMps
      ) {
        throw ApiError.badRequest(
          "Reported speed is impossible",
          {
            code: "LOCATION_IMPOSSIBLE_SPEED",
          },
        );
      }

      const duplicate =
        await repository.findDuplicate(
          input.tripId,
          userId,
          capturedAt,
        );

      if (duplicate) {
        throw ApiError.conflict(
          "Duplicate location point",
          {
            code: "LOCATION_DUPLICATE",
          },
        );
      }

      const previous =
        await repository.findLatest(
          input.tripId,
          userId,
        );

      if (previous) {
        const deltaMs =
          capturedAt.getTime() -
          new Date(previous.capturedAt).getTime();

        if (deltaMs <= 0) {
          throw ApiError.badRequest(
            "Location point is out of order",
            {
              code: "LOCATION_OUT_OF_ORDER",
            },
          );
        }

        if (deltaMs < limits.minIntervalMs) {
          throw ApiError.tooManyRequests(
            "Location updates are too frequent",
            {
              code: "LOCATION_RATE_LIMITED",
              details: {
                minIntervalMs:
                  limits.minIntervalMs,
              },
            },
          );
        }

        const distanceM =
          haversineDistanceM(
            previous,
            input,
          );

        const calculatedSpeedMps =
          distanceM / (deltaMs / 1000);

        if (
          calculatedSpeedMps >
          limits.maxCalculatedSpeedMps
        ) {
          throw ApiError.badRequest(
            "Location jump is physically implausible",
            {
              code: "LOCATION_IMPOSSIBLE_JUMP",
              details: {
                calculatedSpeedMps:
                  Math.round(
                    calculatedSpeedMps * 10,
                  ) / 10,
              },
            },
          );
        }
      }

      const ping =
        await repository.createPingAndUpdateLatest({
          tripId: input.tripId,
          userId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracyM: input.accuracyM,
          altitudeM:
            input.altitudeM ?? null,
          headingDeg:
            input.headingDeg ?? null,
          speedMps:
            input.speedMps ?? null,
          batteryLevel:
            input.batteryLevel ?? null,
          networkStatus:
            input.networkStatus ?? null,
          capturedAt,
          receivedAt: now,
          trustStatus: "TRUSTED",
        });

      const location =
        serializeLocation(
          ping,
          now,
        );

      publisher.publishLocationUpdated({
        tripId: trip.id,
        groupId:
          trip.group?.id ?? null,
        userId,
        location,
      });

      /*
       * Phase 7 deterministic safety evaluation.
       *
       * The location has already been validated and persisted,
       * so a failure inside the safety engine must not cause the
       * client to resend the same GPS point.
       */
      let safety = null;

      if (safetyEvaluator) {
        try {
          safety =
            await safetyEvaluator.evaluateLocation({
              tripId: trip.id,
              userId,
              pingId: ping.id,
              latitude: ping.latitude,
              longitude: ping.longitude,
              capturedAt: ping.capturedAt,
            });
        } catch {
          safety = {
            status: "DEGRADED",
          };
        }
      }

      return {
        id: ping.id,
        tripId: ping.tripId,
        userId,
        trustStatus:
          ping.trustStatus,
        ...location,
        safety,
      };
    },

    async getLatest(userId, tripId) {
      const trip = await requireParticipant(
        repository,
        tripId,
        userId,
        ["ACTIVE"],
      );

      await requireTrackingConsent(
        repository,
        trip,
        userId,
      );

      return serializeLocation(
        await repository.findLatest(
          tripId,
          userId,
        ),
        clock(),
      );
    },

    async getGroupLocations(
      userId,
      groupId,
    ) {
      const group =
        await repository.findGroup(
          groupId,
        );

      if (
        !group ||
        group.trip.status !== "ACTIVE"
      ) {
        throw ApiError.notFound(
          "Active group not found",
          {
            code: "GROUP_NOT_FOUND",
          },
        );
      }

      const requester =
        group.members.find(
          (member) =>
            member.userId === userId,
        );

      if (!requester) {
        throw ApiError.forbidden(
          "Group membership is required to view locations",
          {
            code: "GROUP_MEMBERSHIP_REQUIRED",
          },
        );
      }

      const locations =
        await repository.listLatestForUsers(
          group.tripId,
          group.members.map(
            (member) =>
              member.userId,
          ),
        );

      const byUser = new Map(
        locations.map((location) => [
          location.userId,
          location,
        ]),
      );

      const now = clock();

      return {
        groupId,
        tripId: group.tripId,
        members: group.members.map(
          (member) => ({
            memberId: member.id,
            userId: member.userId,
            role: member.role,
            user: member.user,
            location:
              serializeLocation(
                byUser.get(
                  member.userId,
                ),
                now,
              ),
          }),
        ),
      };
    },
  });

export const trackingService =
  createTrackingService({
    safetyEvaluator: safetyService,
  });

export default trackingService;