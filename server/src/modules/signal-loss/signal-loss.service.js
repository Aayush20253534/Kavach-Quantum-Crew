import { ApiError } from "../../common/errors/ApiError.js";
import { incidentService } from "../incident/incident.service.js";
import { notificationService } from "../notification/notification.service.js";
import { signalLossRepository } from "./signal-loss.repository.js";

const MINUTE = 60_000;
const DEFAULT_GAP_MINUTES = 5;
const RESPONSE_WINDOW_MS = 5 * MINUTE;
const FALSE_ALARM_RECHECK_MS = 2 * 60 * MINUTE;

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
    return repository.updateCase(signalCase.id, {
      status: "ESCALATED",
      escalatedAt: signalCase.escalatedAt || now,
      incidentId: incident?.id ?? signalCase.incidentId ?? null,
    });
  };

  return Object.freeze({
    async sweep() {
      const now = clock();
      const trips = await repository.listActiveGroupTrips();
      const result = { checked: 0, opened: 0, escalated: 0, reminded: 0, resolved: 0 };

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
            signalCase = await escalateCase(signalCase, now);
            result.escalated += 1;
            continue;
          }

          // A leader-confirmed false alarm is intentionally quiet for two hours.
          // If the member is still offline after that cooldown, open a fresh
          // 5-minute verification window and notify only the group leader again.
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
      return result;
    },

    async listForLeader(userId, tripId) {
      return repository.listForLeader(userId, tripId);
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
