import { trackingRepository } from "../modules/tracking/tracking.repository.js";

export const registerTrackingGateway = (
  socket,
  { repository = trackingRepository, log } = {},
) => {
  socket.on("tracking:subscribe", async (payload = {}, acknowledge = () => {}) => {
    try {
      if (!socket.data.user?.id) {
        acknowledge({ ok: false, code: "SOCKET_AUTH_REQUIRED" });
        return;
      }
      if (socket.data.user.role !== "TOURIST") {
        acknowledge({ ok: false, code: "TRACKING_SUBSCRIPTION_FORBIDDEN" });
        return;
      }
      const tripId = payload.tripId;
      if (typeof tripId !== "string" || !tripId.trim()) {
        acknowledge({ ok: false, code: "TRIP_ID_REQUIRED" });
        return;
      }
      const access = await repository.canSubscribeToTrip(tripId.trim(), socket.data.user.id);
      if (!access) {
        acknowledge({ ok: false, code: "TRACKING_SUBSCRIPTION_FORBIDDEN" });
        return;
      }
      await socket.join(`trip:${access.tripId}`);
      if (access.groupId) await socket.join(`group:${access.groupId}`);
      acknowledge({ ok: true, tripId: access.tripId, groupId: access.groupId });
    } catch (error) {
      log?.warn?.({ err: error }, "Tracking room subscription failed");
      acknowledge({ ok: false, code: "TRACKING_SUBSCRIPTION_FAILED" });
    }
  });

  socket.on("tracking:unsubscribe", async (payload = {}, acknowledge = () => {}) => {
    if (typeof payload.tripId !== "string" || !payload.tripId.trim()) {
      acknowledge({ ok: false, code: "TRIP_ID_REQUIRED" });
      return;
    }
    await socket.leave(`trip:${payload.tripId.trim()}`);
    if (typeof payload.groupId === "string" && payload.groupId.trim()) {
      await socket.leave(`group:${payload.groupId.trim()}`);
    }
    acknowledge({ ok: true, tripId: payload.tripId.trim() });
  });
};

export default registerTrackingGateway;
