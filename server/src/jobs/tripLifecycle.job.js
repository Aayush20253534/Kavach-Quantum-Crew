import cron from "node-cron";

import { logger } from "../config/logger.js";
import { emailService } from "../modules/auth/email.service.js";
import { tripRepository } from "../modules/trip/trip.repository.js";

const uniqueRecipients = (trip) => {
  const users = [
    trip.tourist,
    ...(trip.group?.members || []).map((member) => member.user),
  ].filter(Boolean);

  return [...new Map(users.map((user) => [user.id, user])).values()];
};

export const createTripLifecycleJob = ({
  repository = tripRepository,
  mailer = emailService,
  log = logger,
  clock = () => new Date(),
} = {}) => {
  let running = false;

  const processEndingSoon = async () => {
    const now = clock();
    const windowStart = new Date(now.getTime() + 25 * 60_000);
    const windowEnd = new Date(now.getTime() + 35 * 60_000);
    const trips = await repository.findEndingSoonTrips(windowStart, windowEnd);

    for (const trip of trips) {
      for (const recipient of uniqueRecipients(trip)) {
        const alreadySent = await repository.hasReminderAudit(trip.id, recipient.id);
        if (alreadySent) continue;

        try {
          await mailer.sendTripEndingReminder({
            to: recipient.email,
            name: recipient.name,
            locationName: trip.locationName,
            plannedEndAt: trip.plannedEndAt,
          });
          await repository.createReminderAudit(
            trip.id,
            recipient.id,
            new Date(trip.plannedEndAt).toISOString(),
          );
        } catch (error) {
          log.warn(
            { err: error, tripId: trip.id, userId: recipient.id },
            "Trip ending reminder email failed",
          );
        }
      }
    }
  };

  const processExpired = async () => {
    const now = clock();
    const trips = await repository.findExpiredActiveTrips(now, 50);

    for (const trip of trips) {
      try {
        await repository.completeTrip(trip.id, now);
        await repository.createAudit({
          actorId: trip.touristId,
          action: "TRIP_AUTO_COMPLETED",
          entityId: trip.id,
          metadata: {
            plannedEndAt: new Date(trip.plannedEndAt).toISOString(),
            endedAt: now.toISOString(),
          },
        });
      } catch (error) {
        log.error(
          { err: error, tripId: trip.id },
          "Automatic trip completion failed",
        );
      }
    }
  };

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await processExpired();
      await processEndingSoon();
    } finally {
      running = false;
    }
  };

  let task = null;

  return {
    start() {
      if (task) return task;
      // Check frequently so auto-completion is effectively immediate at the
      // planned end while keeping database traffic tiny for this prototype.
      task = cron.schedule("*/15 * * * * *", () => {
        void tick();
      });
      void tick();
      return task;
    },
    stop() {
      task?.stop();
      task = null;
    },
    tick,
  };
};

export const tripLifecycleJob = createTripLifecycleJob();
export default tripLifecycleJob;
