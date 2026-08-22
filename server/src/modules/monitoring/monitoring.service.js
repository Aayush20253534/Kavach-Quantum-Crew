import { ApiError } from "../../common/errors/ApiError.js";
import { haversineDistanceM } from "../../common/utils/geo.js";
import { distanceToRouteM } from "../../common/utils/routeDistance.js";
import { ROLES } from "../../constants/roles.js";
import { incidentService } from "../incident/incident.service.js";
import { monitoringRepository } from "./monitoring.repository.js";

export const DEFAULT_MONITORING_POLICY = Object.freeze({
  enabled: true,
  trackingGapAfterMinutes: 5,
  inactivityAfterMinutes: 15,
  inactivityRadiusM: 50,
  groupSeparationM: 500,
  routeDeviationM: 300,
  overtimeGraceMinutes: 15,
  plannedRoute: null,
});

const STAFF = new Set([ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN]);
const participant = (trip, userId) => trip?.touristId === userId || Boolean(trip?.group?.members?.some((member) => member.userId === userId));
const minutes = (value) => value * 60_000;

export const createMonitoringService = ({
  repository = monitoringRepository,
  incidentReporter = incidentService,
  clock = () => new Date(),
} = {}) => {
  const findTrip = async (tripId) => {
    const trip = await repository.findTrip(tripId);
    if (!trip) throw ApiError.notFound("Trip not found", { code: "TRIP_NOT_FOUND" });
    return trip;
  };

  const policyFor = (trip) => ({ ...DEFAULT_MONITORING_POLICY, ...(trip.monitoringPolicy ?? {}) });

  const ensureAlert = async ({ tripId, userId, type, level = "WARNING", sourceId, message, details }) => {
    const existing = await repository.findOpenAlert(tripId, userId, type, sourceId);
    const alert = existing ?? await repository.createAlert({ tripId, userId, type, level, sourceId, message, details });
    if (incidentReporter && !existing) await incidentReporter.ingestSafetyAlert(alert);
    return alert;
  };

  const resolveAlert = (tripId, userId, type, sourceId, now) => repository.resolveOpenAlert(tripId, userId, type, sourceId, now);

  const evaluate = async (trip, userId, now) => {
    const policy = policyFor(trip);
    if (!policy.enabled || trip.status !== "ACTIVE") return { level: "SAFE", findings: [], policy };

    const findings = [];
    const add = (type, level, details = {}) => findings.push({ type, level, details });
    const latest = await repository.findLatest(trip.id, userId);

    const overtimeAt = new Date(trip.plannedEndAt).getTime() + minutes(policy.overtimeGraceMinutes);
    if (now.getTime() > overtimeAt) {
      await ensureAlert({ tripId: trip.id, userId, type: "TRIP_OVERTIME", sourceId: "trip-overtime", message: "Trip has exceeded its planned end time", details: { plannedEndAt: trip.plannedEndAt, graceMinutes: policy.overtimeGraceMinutes } });
      add("TRIP_OVERTIME", "WARNING");
    } else {
      await resolveAlert(trip.id, userId, "TRIP_OVERTIME", "trip-overtime", now);
    }

    const gapExceeded = !latest || now.getTime() - new Date(latest.capturedAt).getTime() > minutes(policy.trackingGapAfterMinutes);
    if (gapExceeded) {
      await ensureAlert({ tripId: trip.id, userId, type: "TRACKING_INTERRUPTION", sourceId: "tracking-gap", message: "Location tracking has been interrupted", details: { latestLocationAt: latest?.capturedAt ?? null, thresholdMinutes: policy.trackingGapAfterMinutes } });
      add("TRACKING_INTERRUPTION", "WARNING");
    } else {
      await resolveAlert(trip.id, userId, "TRACKING_INTERRUPTION", "tracking-gap", now);
    }

    if (latest) {
      const since = new Date(now.getTime() - minutes(policy.inactivityAfterMinutes));
      const recent = await repository.listRecentLocations(trip.id, userId, since);
      const inactive = recent.length >= 2 && recent.every((point) => haversineDistanceM(recent[0], point) <= policy.inactivityRadiusM);
      if (inactive) {
        await ensureAlert({ tripId: trip.id, userId, type: "INACTIVITY", sourceId: "inactivity", message: "Tourist has remained in the same area for an extended period", details: { thresholdMinutes: policy.inactivityAfterMinutes, radiusM: policy.inactivityRadiusM } });
        add("INACTIVITY", "WARNING");
      } else {
        await resolveAlert(trip.id, userId, "INACTIVITY", "inactivity", now);
      }

      const route = Array.isArray(policy.plannedRoute) ? policy.plannedRoute : [];
      const routeDistance = distanceToRouteM(latest, route);
      if (routeDistance !== null && routeDistance > policy.routeDeviationM) {
        await ensureAlert({ tripId: trip.id, userId, type: "ROUTE_DEVIATION", sourceId: "planned-route", message: "Tourist has deviated from the configured route corridor", details: { distanceM: Math.round(routeDistance), thresholdM: policy.routeDeviationM } });
        add("ROUTE_DEVIATION", "WARNING", { distanceM: routeDistance });
      } else {
        await resolveAlert(trip.id, userId, "ROUTE_DEVIATION", "planned-route", now);
      }

      if (trip.group && userId !== trip.group.leaderId) {
        const leader = await repository.findLatest(trip.id, trip.group.leaderId);
        const separation = leader ? haversineDistanceM(latest, leader) : null;
        if (separation !== null && separation > policy.groupSeparationM) {
          await ensureAlert({ tripId: trip.id, userId, type: "GROUP_SEPARATION", sourceId: trip.group.id, message: "Tourist is separated from the group leader", details: { groupId: trip.group.id, distanceM: Math.round(separation), thresholdM: policy.groupSeparationM } });
          add("GROUP_SEPARATION", "WARNING", { distanceM: separation });
        } else {
          await resolveAlert(trip.id, userId, "GROUP_SEPARATION", trip.group.id, now);
        }
      }
    }

    const level = findings.some((finding) => finding.level === "DANGER") ? "DANGER" : findings.length ? "WARNING" : "SAFE";
    return { level, findings, latestLocationAt: latest?.capturedAt ?? null, policy };
  };

  return Object.freeze({
    async getPolicy(actor, tripId) {
      const trip = await findTrip(tripId);
      if (!STAFF.has(actor.role) && !participant(trip, actor.id)) throw ApiError.notFound("Trip not found", { code: "TRIP_NOT_FOUND" });
      return policyFor(trip);
    },

    async updatePolicy(actor, tripId, input) {
      const trip = await findTrip(tripId);
      const owner = actor.role === ROLES.TOURIST && trip.touristId === actor.id;
      if (!owner && !STAFF.has(actor.role)) throw ApiError.forbidden("Only the trip owner or safety staff can update monitoring policy", { code: "MONITORING_POLICY_FORBIDDEN" });
      const policy = await repository.upsertPolicy(tripId, input);
      await repository.createAudit({ actorId: actor.id, actorRole: actor.role, action: "TRIP_MONITORING_POLICY_UPDATED", entityId: policy.id, metadata: { tripId } });
      return policy;
    },

    async evaluateParticipant(actor, tripId, userId = actor.id) {
      const trip = await findTrip(tripId);
      if (trip.status !== "ACTIVE") throw ApiError.conflict("Trip monitoring requires an active trip", { code: "TRIP_MONITORING_NOT_ACTIVE" });
      if (actor.role === ROLES.TOURIST && (actor.id !== userId || !participant(trip, userId))) throw ApiError.notFound("Trip not found", { code: "TRIP_NOT_FOUND" });
      if (!STAFF.has(actor.role) && actor.role !== ROLES.TOURIST) throw ApiError.forbidden("Monitoring access denied", { code: "MONITORING_FORBIDDEN" });
      return evaluate(trip, userId, clock());
    },

    async evaluateAfterPing({ tripId, userId }) {
      const trip = await repository.findTrip(tripId);
      if (!trip || trip.status !== "ACTIVE" || !participant(trip, userId)) return null;
      return evaluate(trip, userId, clock());
    },

    async sweep(actor, limit = 100) {
      if (actor.role !== ROLES.SYSTEM_ADMIN) throw ApiError.forbidden("System admin access required", { code: "MONITORING_SWEEP_FORBIDDEN" });
      const trips = await repository.listActiveTrips(limit);
      const results = [];
      for (const row of trips) {
        const trip = await repository.findTrip(row.id);
        const userIds = [trip.touristId, ...(trip.group?.members?.map((member) => member.userId) ?? [])];
        for (const userId of new Set(userIds)) results.push({ tripId: trip.id, userId, ...(await evaluate(trip, userId, clock())) });
      }
      return results;
    },
  });
};

export const monitoringService = createMonitoringService();
export default monitoringService;
