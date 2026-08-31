import { ApiError } from "../../common/errors/ApiError.js";
import { haversineDistanceM } from "../../common/utils/geo.js";
import { incidentService } from "../incident/incident.service.js";
import { notificationService } from "../notification/notification.service.js";
import { signalLossRepository } from "./signal-loss.repository.js";

const MINUTE = 60_000;
const DEFAULT_GAP_MINUTES = 5;
const RESPONSE_WINDOW_MS = 5 * MINUTE;
const FALSE_ALARM_RECHECK_MS = 2 * 60 * MINUTE;
const SOLO_MISSING_AFTER_MS = 10 * MINUTE;
const SOLO_RESPONSE_WINDOW_MS = 5 * MINUTE;
const SOLO_SOURCE_ID = "solo-signal-loss";
const GROUP_SEPARATION_SOURCE_ID = "group-centroid-separation";
const GROUP_RADIUS_M = 500;
const GROUP_SEPARATION_CONFIRMATIONS = 2;

const asDate = (value) => value ? new Date(value) : null;

const centroid = (points) => ({
  latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
  longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length,
});

// Choose the densest 500 m neighbourhood so a member who is already far away
// cannot drag the group centre toward themselves.
const majorityCluster = (points, radiusM = GROUP_RADIUS_M) => {
  if (!points.length) return [];
  let best = [points[0]];
  for (const candidate of points) {
    const cluster = points.filter((point) => haversineDistanceM(candidate, point) <= radiusM);
    if (cluster.length > best.length) best = cluster;
  }
  return best;
};

export const createSignalLossService = ({
  repository = signalLossRepository,
  notifier = notificationService,
  incidentReporter = incidentService,
  clock = () => new Date(),
} = {}) => {
  const escalateCase = async (signalCase, now) => {
    let alert = await repository.findAlertByCase(signalCase.tripId, signalCase.userId, signalCase.id);
    if (!alert) {
      alert = await repository.createSafetyAlert({
        tripId: signalCase.tripId,
        userId: signalCase.userId,
        type: "TRACKING_INTERRUPTION",
        level: "DANGER",
        sourceId: signalCase.id,
        message: "Group member signal loss was not cleared by the leader within 5 minutes",
        details: { signalLossCaseId: signalCase.id, detectedAt: signalCase.detectedAt },
      });
    }
    const incident = await incidentReporter.ingestSafetyAlert(alert);
    const updated = await repository.updateCase(signalCase.id, {
      status: "ESCALATED",
      escalatedAt: signalCase.escalatedAt || now,
      incidentId: incident?.id ?? signalCase.incidentId ?? null,
    });
    await repository.createAudit({
      actorId: signalCase.leaderId,
      action: "SIGNAL_LOSS_AUTO_ESCALATED",
      entityId: signalCase.id,
      metadata: {
        tripId: signalCase.tripId,
        userId: signalCase.userId,
        incidentId: incident?.id ?? null,
        reason: "LEADER_RESPONSE_TIMEOUT",
      },
    });
    return updated;
  };

  const escalateSoloAlert = async (alert, trip, now) => {
    const existingIncident = await repository.findIncidentByAlert(alert.id);
    if (existingIncident) return existingIncident;

    const details = {
      ...(alert.details && typeof alert.details === "object" ? alert.details : {}),
      soloMissingCheck: true,
      escalatedToDisasterManagement: true,
      escalationReason: "TOURIST_SAFETY_CONFIRMATION_TIMEOUT",
      escalatedAt: now.toISOString(),
    };
    const escalatedAlert = await repository.updateSafetyAlert(alert.id, {
      level: "DANGER",
      message: "Solo tourist did not confirm safety after a 10-minute tracking interruption",
      details,
    });
    const incident = await incidentReporter.ingestSafetyAlert(escalatedAlert);
    await repository.createAudit({
      actorId: trip.touristId,
      action: "SOLO_SIGNAL_LOSS_ESCALATED",
      entityId: alert.id,
      metadata: {
        tripId: trip.id,
        userId: trip.touristId,
        incidentId: incident?.id ?? null,
        reason: "TOURIST_SAFETY_CONFIRMATION_TIMEOUT",
      },
    });
    return incident;
  };

  const sweepGroupTrips = async (now, result) => {
    const trips = await repository.listActiveGroupTrips();
    for (const trip of trips) {
      if (!trip.group) continue;
      const gapMinutes = trip.monitoringPolicy?.trackingGapAfterMinutes ?? DEFAULT_GAP_MINUTES;
      for (const member of trip.group.members) {
        if (member.userId === trip.group.leaderId) continue;
        result.checked += 1;
        const latest = await repository.findLatest(trip.id, member.userId);
        const referenceAt = latest?.capturedAt ?? trip.startedAt ?? trip.plannedStartAt;
        const offlineMs = now.getTime() - new Date(referenceAt).getTime();
        const offline = offlineMs >= gapMinutes * MINUTE;
        let signalCase = await repository.findOpenCase(trip.id, member.userId);

        if (!offline) {
          if (signalCase) {
            await repository.updateCase(signalCase.id, { status: "RESOLVED", resolvedAt: now });
            await repository.resolveAlertByCase(signalCase.tripId, signalCase.userId, signalCase.id, now);
            result.resolved += 1;
          }
          continue;
        }

        if (!signalCase) {
          signalCase = await repository.createCase({
            tripId: trip.id,
            groupId: trip.group.id,
            userId: member.userId,
            leaderId: trip.group.leaderId,
            detectedAt: now,
            lastNotifiedAt: now,
            responseDeadlineAt: new Date(now.getTime() + RESPONSE_WINDOW_MS),
            nextReminderAt: new Date(now.getTime() + FALSE_ALARM_RECHECK_MS),
          });
          await notifier.signalLoss({ signalCase, trip, member: member.user, leader: trip.group.leader, reminder: false });
          result.opened += 1;
          continue;
        }

        if (signalCase.status === "WAITING_FOR_LEADER" && now >= new Date(signalCase.responseDeadlineAt)) {
          await escalateCase(signalCase, now);
          result.escalated += 1;
          continue;
        }

        if (
          signalCase.status === "FALSE_ALARM" &&
          signalCase.nextReminderAt &&
          now >= new Date(signalCase.nextReminderAt)
        ) {
          const updated = await repository.updateCase(signalCase.id, {
            status: "WAITING_FOR_LEADER",
            leaderResponse: null,
            leaderRespondedAt: null,
            resolvedAt: null,
            lastNotifiedAt: now,
            responseDeadlineAt: new Date(now.getTime() + RESPONSE_WINDOW_MS),
            nextReminderAt: new Date(now.getTime() + FALSE_ALARM_RECHECK_MS),
          });
          await notifier.signalLoss({
            signalCase: updated,
            trip,
            member: member.user,
            leader: trip.group.leader,
            reminder: true,
          });
          result.reminded += 1;
        }
      }
    }
  };

  const sweepGroupSeparation = async (now, result) => {
    const trips = await repository.listActiveGroupTrips();
    for (const trip of trips) {
      if (!trip.group?.members?.length) continue;
      const located = [];
      for (const member of trip.group.members) {
        const latest = await repository.findLatest(trip.id, member.userId);
        if (!latest) continue;
        const ageMs = now.getTime() - new Date(latest.capturedAt).getTime();
        if (ageMs > 2 * MINUTE) continue;
        located.push({ ...latest, userId: member.userId, member });
      }
      if (located.length < 2) continue;
      const cluster = majorityCluster(located);
      const center = centroid(cluster);
      const clusterIds = cluster.map((point) => point.userId);

      for (const point of located) {
        result.separationChecked += 1;
        const distanceM = haversineDistanceM(point, center);
        let alert = await repository.findOpenSeparationAlert(trip.id, point.userId);
        if (distanceM <= GROUP_RADIUS_M) {
          if (alert && !await repository.findIncidentByAlert(alert.id)) {
            await repository.updateSafetyAlert(alert.id, { status: "RESOLVED", resolvedAt: now, details: { ...(alert.details || {}), autoClearedAfterReturn: true, returnedAt: now.toISOString() } });
            result.separationResolved += 1;
          }
          continue;
        }

        if (!alert) {
          await repository.createSafetyAlert({ tripId: trip.id, userId: point.userId, type: "GROUP_SEPARATION", level: "WARNING", sourceId: GROUP_SEPARATION_SOURCE_ID, message: "Group member is outside the 500 m majority-group safety radius", details: { groupSeparationCheck: true, consecutiveOutsideEvaluations: 1, confirmationStarted: false, leaderId: trip.group.leaderId, groupId: trip.group.id, thresholdM: GROUP_RADIUS_M, distanceM: Math.round(distanceM), centroid: { latitude: center.latitude, longitude: center.longitude }, majorityMemberIds: clusterIds, firstOutsideAt: now.toISOString(), escalatedToDisasterManagement: false } });
          continue;
        }

        const details = alert.details || {};
        if (!details.confirmationStarted) {
          const count = Number(details.consecutiveOutsideEvaluations || 1) + 1;
          const responseDeadlineAt = new Date(now.getTime() + RESPONSE_WINDOW_MS);
          const updated = await repository.updateSafetyAlert(alert.id, { details: { ...details, consecutiveOutsideEvaluations: count, distanceM: Math.round(distanceM), centroid: { latitude: center.latitude, longitude: center.longitude }, majorityMemberIds: clusterIds, ...(count >= GROUP_SEPARATION_CONFIRMATIONS ? { confirmationStarted: true, promptedAt: now.toISOString(), responseDeadlineAt: responseDeadlineAt.toISOString() } : {}) } });
          if (count >= GROUP_SEPARATION_CONFIRMATIONS) {
            await notifier.groupSeparationPrompt?.({ alert: updated, trip, member: point.member.user, leader: trip.group.leader });
            result.separationPrompted += 1;
          }
          continue;
        }

        const deadline = asDate(details.responseDeadlineAt);
        if (details.escalatedToDisasterManagement !== true && deadline && now >= deadline) {
          const escalated = await repository.updateSafetyAlert(alert.id, { level: "DANGER", message: "Group member safety was not confirmed within 5 minutes after separation", details: { ...details, escalatedToDisasterManagement: true, escalationReason: "GROUP_SEPARATION_CONFIRMATION_TIMEOUT", escalatedAt: now.toISOString() } });
          await incidentReporter.ingestSafetyAlert(escalated);
          result.separationEscalated += 1;
        }
      }
    }
  };

  const sweepSoloTrips = async (now, result) => {
    const trips = await repository.listActiveSoloTrips?.() ?? [];
    for (const trip of trips) {
      const tourist = trip.tourist;
      if (!tourist) continue;
      result.soloChecked += 1;

      const latest = await repository.findLatest(trip.id, trip.touristId);
      const referenceAt = latest?.capturedAt ?? trip.startedAt ?? trip.plannedStartAt;
      const offlineMs = now.getTime() - new Date(referenceAt).getTime();
      let alert = await repository.findOpenSoloAlert(trip.id, trip.touristId);

      if (offlineMs < SOLO_MISSING_AFTER_MS) {
        if (alert) {
          const linked = await repository.findIncidentByAlert(alert.id);
          if (!linked) {
            await repository.resolveSoloAlert(trip.id, trip.touristId, now);
            result.soloResolved += 1;
          }
        }
        continue;
      }

      if (!alert) {
        const responseDeadlineAt = new Date(now.getTime() + SOLO_RESPONSE_WINDOW_MS);
        alert = await repository.createSafetyAlert({
          tripId: trip.id,
          userId: trip.touristId,
          type: "TRACKING_INTERRUPTION",
          level: "WARNING",
          sourceId: SOLO_SOURCE_ID,
          message: "KAVACH has not received your location for 10 minutes. Please confirm that you are safe.",
          details: {
            soloMissingCheck: true,
            promptedAt: now.toISOString(),
            responseDeadlineAt: responseDeadlineAt.toISOString(),
            latestLocationAt: latest?.capturedAt ?? null,
            thresholdMinutes: 10,
            escalatedToDisasterManagement: false,
          },
        });
        await notifier.soloSignalLossPrompt?.({ alert, trip, tourist });
        await repository.createAudit({
          actorId: trip.touristId,
          action: "SOLO_SIGNAL_LOSS_PROMPTED",
          entityId: alert.id,
          metadata: { tripId: trip.id, userId: trip.touristId, responseDeadlineAt },
        });
        result.soloPrompted += 1;
        continue;
      }

      const details = alert.details && typeof alert.details === "object" ? alert.details : {};
      const deadline = asDate(details.responseDeadlineAt);
      const alreadyEscalated = details.escalatedToDisasterManagement === true || Boolean(await repository.findIncidentByAlert(alert.id));
      if (!alreadyEscalated && deadline && now >= deadline) {
        await escalateSoloAlert(alert, trip, now);
        result.soloEscalated += 1;
      }
    }
  };

  return Object.freeze({
    async sweep() {
      const now = clock();
      const result = {
        checked: 0,
        opened: 0,
        escalated: 0,
        reminded: 0,
        resolved: 0,
        soloChecked: 0,
        soloPrompted: 0,
        soloEscalated: 0,
        soloResolved: 0,
        separationChecked: 0, separationPrompted: 0, separationEscalated: 0, separationResolved: 0,
      };
      await sweepGroupTrips(now, result);
      await sweepGroupSeparation(now, result);
      await sweepSoloTrips(now, result);
      return result;
    },

    async listForLeader(userId, tripId) {
      return repository.listForLeader(userId, tripId);
    },

    async listSoloForTourist(userId, tripId) {
      const alerts = await repository.listSoloAlertsForTourist(userId, tripId);
      return alerts.filter((alert) => alert.details?.soloMissingCheck === true && alert.details?.escalatedToDisasterManagement !== true);
    },

    async listSeparationForUser(userId, tripId) {
      const alerts = await repository.listSeparationAlertsForUser(userId, tripId);
      return alerts.filter((alert) => alert.details?.groupSeparationCheck === true && alert.details?.confirmationStarted === true && alert.details?.escalatedToDisasterManagement !== true);
    },

    async respondSeparation(userId, alertId, response) {
      const alert = await repository.findSeparationAlertForResponder(alertId, userId);
      if (!alert) throw ApiError.notFound("Group separation safety check not found", { code: "GROUP_SEPARATION_CHECK_NOT_FOUND" });
      const now = clock();
      if (await repository.findIncidentByAlert(alert.id)) throw ApiError.conflict("This separation case has already escalated", { code: "GROUP_SEPARATION_ALREADY_ESCALATED" });
      const isLeader = alert.details?.leaderId === userId;
      if (response === "SAFE") {
        return repository.updateSafetyAlert(alert.id, { status: "RESOLVED", resolvedAt: now, details: { ...(alert.details || {}), safetyResponse: "SAFE", respondedBy: userId, responderRole: isLeader ? "LEADER" : "MEMBER", respondedAt: now.toISOString() } });
      }
      if (response === "UNSAFE") {
        const escalated = await repository.updateSafetyAlert(alert.id, { level: "DANGER", message: "Separated group member was reported unsafe", details: { ...(alert.details || {}), safetyResponse: "UNSAFE", respondedBy: userId, responderRole: isLeader ? "LEADER" : "MEMBER", respondedAt: now.toISOString(), escalatedToDisasterManagement: true, escalationReason: isLeader ? "LEADER_REPORTED_UNSAFE" : "MEMBER_REQUESTED_HELP" } });
        const incident = await incidentReporter.ingestSafetyAlert(escalated);
        return { ...escalated, incidentId: incident?.id ?? null };
      }
      throw ApiError.badRequest("Unsupported group separation response", { code: "GROUP_SEPARATION_RESPONSE_INVALID" });
    },

    async respondSolo(userId, alertId, response) {
      const alert = await repository.findSoloAlertForTourist(alertId, userId);
      if (!alert) throw ApiError.notFound("Solo safety check not found", { code: "SOLO_SAFETY_CHECK_NOT_FOUND" });
      const trip = await repository.findTripStatus(alert.tripId);
      if (!trip || trip.status !== "ACTIVE" || trip.tripType !== "SOLO" || trip.touristId !== userId) {
        throw ApiError.conflict("This solo trip is no longer active", { code: "SOLO_SAFETY_CHECK_TRIP_INACTIVE" });
      }
      const linked = await repository.findIncidentByAlert(alert.id);
      if (linked) {
        throw ApiError.conflict("This safety check has already escalated to Disaster Management", {
          code: "SOLO_SAFETY_CHECK_ALREADY_ESCALATED",
          details: { incidentId: linked.id },
        });
      }
      const now = clock();

      if (response === "I_AM_SAFE") {
        const details = {
          ...(alert.details && typeof alert.details === "object" ? alert.details : {}),
          touristResponse: "I_AM_SAFE",
          respondedAt: now.toISOString(),
        };
        const updated = await repository.updateSafetyAlert(alert.id, { status: "RESOLVED", resolvedAt: now, details });
        await repository.createAudit({
          actorId: userId,
          action: "SOLO_SIGNAL_LOSS_CONFIRMED_SAFE",
          entityId: alert.id,
          metadata: { tripId: alert.tripId, userId },
        });
        return updated;
      }

      if (response === "NEED_HELP") {
        const escalated = await repository.updateSafetyAlert(alert.id, {
          level: "DANGER",
          message: "Solo tourist requested help after a tracking interruption",
          details: {
            ...(alert.details && typeof alert.details === "object" ? alert.details : {}),
            touristResponse: "NEED_HELP",
            respondedAt: now.toISOString(),
            escalatedToDisasterManagement: true,
            escalationReason: "TOURIST_REQUESTED_HELP",
          },
        });
        const incident = await incidentReporter.ingestSafetyAlert(escalated);
        await repository.createAudit({
          actorId: userId,
          action: "SOLO_SIGNAL_LOSS_REQUESTED_HELP",
          entityId: alert.id,
          metadata: { tripId: alert.tripId, userId, incidentId: incident?.id ?? null },
        });
        return { ...escalated, incidentId: incident?.id ?? null };
      }

      throw ApiError.badRequest("Unsupported solo safety response", { code: "SOLO_SAFETY_RESPONSE_INVALID" });
    },

    async respond(userId, caseId, response) {
      const signalCase = await repository.findCase(caseId);
      if (!signalCase || signalCase.leaderId !== userId) {
        throw ApiError.notFound("Signal-loss case not found", { code: "SIGNAL_LOSS_CASE_NOT_FOUND" });
      }
      const trip = await repository.findTripStatus(signalCase.tripId);
      if (!trip || trip.status !== "ACTIVE") {
        throw ApiError.conflict("This trip is no longer active", { code: "SIGNAL_LOSS_TRIP_ENDED" });
      }
      if (signalCase.status !== "WAITING_FOR_LEADER") {
        throw ApiError.conflict("This signal-loss response window is already closed", { code: "SIGNAL_LOSS_RESPONSE_WINDOW_CLOSED" });
      }
      const now = clock();

      if (response === "FALSE_ALARM") {
        await repository.resolveAlertByCase(signalCase.tripId, signalCase.userId, signalCase.id, now);
        const updated = await repository.updateCase(signalCase.id, {
          status: "FALSE_ALARM",
          leaderResponse: "FALSE_ALARM",
          leaderRespondedAt: now,
          resolvedAt: now,
          nextReminderAt: new Date(now.getTime() + FALSE_ALARM_RECHECK_MS),
        });
        await repository.createAudit({ actorId: userId, action: "SIGNAL_LOSS_FALSE_ALARM", entityId: caseId, metadata: { tripId: signalCase.tripId, userId: signalCase.userId } });
        return updated;
      }

      if (response === "CONFIRMED_DANGER") {
        const updated = await repository.updateCase(signalCase.id, {
          leaderResponse: "CONFIRMED_DANGER",
          leaderRespondedAt: now,
          nextReminderAt: null,
        });
        const escalated = await escalateCase(updated, now);
        await repository.createAudit({ actorId: userId, action: "SIGNAL_LOSS_CONFIRMED_DANGER", entityId: caseId, metadata: { tripId: signalCase.tripId, userId: signalCase.userId } });
        return escalated;
      }

      throw ApiError.badRequest("Unsupported leader response", { code: "SIGNAL_LOSS_RESPONSE_INVALID" });
    },
  });
};

export const signalLossService = createSignalLossService();
export default signalLossService;
