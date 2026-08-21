import { ApiError } from "../../common/errors/ApiError.js";
import { haversineDistanceM } from "../../common/utils/geo.js";
import { incidentService } from "../incident/incident.service.js";
import { safetyRepository } from "./safety.repository.js";

export const SAFETY_LIMITS = Object.freeze({
  staleLocationAfterMs: 120_000,
  minCheckInLeadMs: 60_000,
  maxCheckInLeadMs: 24 * 60 * 60 * 1000,
});

const isParticipant = (trip, userId) =>
  trip?.touristId === userId || Boolean(trip?.group?.members?.some((member) => member.userId === userId));

const requireTrip = async (repository, tripId, userId, allowedStatuses = ["ACTIVE"]) => {
  const trip = await repository.findTripContext(tripId, userId);
  if (!trip || !isParticipant(trip, userId)) {
    throw ApiError.notFound("Trip not found", { code: "TRIP_NOT_FOUND" });
  }
  if (!allowedStatuses.includes(trip.status)) {
    throw ApiError.conflict("Trip is not in a safety-monitoring state", {
      code: "TRIP_SAFETY_NOT_ACTIVE",
      details: { status: trip.status },
    });
  }
  return trip;
};

const alertLevelForZone = (zone) =>
  ["HIGH", "CRITICAL"].includes(zone.severity) ? "DANGER" : "WARNING";

const riskFromAlerts = (alerts) => {
  if (alerts.some((alert) => alert.status !== "RESOLVED" && alert.level === "DANGER")) return "DANGER";
  if (alerts.some((alert) => alert.status !== "RESOLVED")) return "WARNING";
  return "SAFE";
};

export const createSafetyService = ({
  repository = safetyRepository,
  clock = () => new Date(),
  limits = SAFETY_LIMITS,
  incidentReporter = null,
} = {}) => {
  const ensureAlert = async ({ tripId, userId, type, level, sourceId, message, details }) => {
    const existing = await repository.findOpenAlert(tripId, userId, type, sourceId);
    const alert = existing ?? (await repository.createAlert({ tripId, userId, type, level, sourceId, message, details }));
    if (incidentReporter) await incidentReporter.ingestSafetyAlert(alert);
    return alert;
  };

  const processDueCheckIns = async (tripId, now = clock()) => {
    const due = await repository.findDueCheckIns(tripId, now);
    const missed = [];
    for (const checkIn of due) {
      const updated = await repository.markCheckInMissed(checkIn.id, now);
      await ensureAlert({
        tripId: checkIn.tripId,
        userId: checkIn.userId,
        type: "MISSED_CHECK_IN",
        level: "WARNING",
        sourceId: checkIn.id,
        message: "Scheduled safety check-in was missed",
        details: { dueAt: checkIn.dueAt },
      });
      missed.push(updated);
    }
    return missed;
  };

  return Object.freeze({
    async createZone(actor, input) {
      const zone = await repository.createZone(input);
      await repository.createAudit({
        actorId: actor.id,
        actorRole: actor.role,
        action: "SAFETY_ZONE_CREATED",
        entityType: "SafetyZone",
        entityId: zone.id,
        metadata: { type: zone.type, severity: zone.severity },
      });
      return zone;
    },

    listZones(query) {
      return repository.listZones(query);
    },

    async scheduleCheckIn(userId, tripId, dueAtInput) {
      await requireTrip(repository, tripId, userId, ["ACTIVE"]);
      const now = clock();
      const dueAt = new Date(dueAtInput);
      const leadMs = dueAt.getTime() - now.getTime();
      if (leadMs < limits.minCheckInLeadMs || leadMs > limits.maxCheckInLeadMs) {
        throw ApiError.badRequest("Check-in must be scheduled between 1 minute and 24 hours from now", {
          code: "CHECK_IN_TIME_INVALID",
        });
      }
      const checkIn = await repository.createCheckIn({ tripId, userId, dueAt });
      await repository.createAudit({
        actorId: userId,
        action: "CHECK_IN_SCHEDULED",
        entityType: "TripCheckIn",
        entityId: checkIn.id,
        metadata: { tripId, dueAt: dueAt.toISOString() },
      });
      return checkIn;
    },

    async completeCheckIn(userId, checkInId) {
      const checkIn = await repository.findCheckIn(checkInId);
      if (!checkIn || checkIn.userId !== userId) {
        throw ApiError.notFound("Check-in not found", { code: "CHECK_IN_NOT_FOUND" });
      }
      await requireTrip(repository, checkIn.tripId, userId, ["ACTIVE"]);
      if (checkIn.status !== "PENDING") {
        throw ApiError.conflict("Check-in is no longer pending", {
          code: "CHECK_IN_NOT_PENDING",
          details: { status: checkIn.status },
        });
      }
      const now = clock();
      const completed = await repository.completeCheckIn(checkInId, now);
      await repository.resolveOpenAlert(checkIn.tripId, userId, "MISSED_CHECK_IN", checkIn.id, now);
      await repository.createAudit({
        actorId: userId,
        action: "CHECK_IN_COMPLETED",
        entityType: "TripCheckIn",
        entityId: checkIn.id,
        metadata: { tripId: checkIn.tripId },
      });
      return completed;
    },

    async listCheckIns(userId, tripId) {
      await requireTrip(repository, tripId, userId, ["ACTIVE", "COMPLETED"]);
      await processDueCheckIns(tripId);
      return repository.listCheckIns(tripId, userId);
    },

    async evaluateLocation({ tripId, userId, pingId, latitude, longitude, capturedAt }) {
      await requireTrip(repository, tripId, userId, ["ACTIVE"]);
      const now = clock();
      await processDueCheckIns(tripId, now);
      const zones = await repository.listActiveZones();
      const events = [];
      const activeRiskZones = [];

      for (const zone of zones) {
        const inside = haversineDistanceM(
          { latitude, longitude },
          { latitude: zone.latitude, longitude: zone.longitude },
        ) <= zone.radiusM;
        const last = await repository.findLastGeofenceEvent(tripId, userId, zone.id);
        const wasInside = last?.type === "ENTER";
        if (inside !== wasInside) {
          const type = inside ? "ENTER" : "EXIT";
          const event = await repository.createGeofenceEvent({
            tripId,
            userId,
            zoneId: zone.id,
            locationPingId: pingId ?? null,
            type,
            occurredAt: new Date(capturedAt ?? now),
          });
          events.push(event);
          if (zone.type === "RISK") {
            if (inside) {
              await ensureAlert({
                tripId,
                userId,
                type: "RISK_ZONE_ENTRY",
                level: alertLevelForZone(zone),
                sourceId: zone.id,
                message: `Entered risk zone: ${zone.name}`,
                details: { zoneId: zone.id, zoneName: zone.name, severity: zone.severity },
              });
            } else {
              await repository.resolveOpenAlert(tripId, userId, "RISK_ZONE_ENTRY", zone.id, now);
            }
          }
        }
        if (inside && zone.type === "RISK") activeRiskZones.push(zone);
      }

      const level = activeRiskZones.some((zone) => ["HIGH", "CRITICAL"].includes(zone.severity))
        ? "DANGER"
        : activeRiskZones.length
          ? "WARNING"
          : "SAFE";

      return { level, events, activeRiskZones };
    },

    async getRisk(userId, tripId) {
      await requireTrip(repository, tripId, userId, ["ACTIVE"]);
      const now = clock();
      await processDueCheckIns(tripId, now);
      const latest = await repository.findLatestLocation(tripId, userId);
      if (latest) {
        const stale = now.getTime() - new Date(latest.capturedAt).getTime() > limits.staleLocationAfterMs;
        if (stale) {
          await ensureAlert({
            tripId,
            userId,
            type: "STALE_LOCATION",
            level: "WARNING",
            sourceId: "latest-location",
            message: "Location has not updated recently",
            details: { capturedAt: latest.capturedAt },
          });
        } else {
          await repository.resolveOpenAlert(tripId, userId, "STALE_LOCATION", "latest-location", now);
        }
      }
      const alerts = await repository.listAlerts(tripId, userId, { limit: 100 });
      return {
        level: riskFromAlerts(alerts),
        latestLocationAt: latest?.capturedAt ?? null,
        activeAlerts: alerts.filter((alert) => alert.status !== "RESOLVED"),
      };
    },

    async listAlerts(userId, tripId, query) {
      await requireTrip(repository, tripId, userId, ["ACTIVE", "COMPLETED"]);
      await processDueCheckIns(tripId);
      return repository.listAlerts(tripId, userId, query);
    },

    async acknowledgeAlert(userId, alertId) {
      const alert = await repository.findAlert(alertId);
      if (!alert || alert.userId !== userId) {
        throw ApiError.notFound("Alert not found", { code: "SAFETY_ALERT_NOT_FOUND" });
      }
      if (alert.status === "RESOLVED") {
        throw ApiError.conflict("Resolved alert cannot be acknowledged", { code: "SAFETY_ALERT_RESOLVED" });
      }
      if (alert.status === "ACKNOWLEDGED") return alert;
      const acknowledged = await repository.acknowledgeAlert(alertId, clock());
      await repository.createAudit({
        actorId: userId,
        action: "SAFETY_ALERT_ACKNOWLEDGED",
        entityType: "SafetyAlert",
        entityId: alert.id,
        metadata: { tripId: alert.tripId, type: alert.type },
      });
      return acknowledged;
    },

    processDueCheckIns,
  });
};

export const safetyService = createSafetyService({ incidentReporter: incidentService });
export default safetyService;
