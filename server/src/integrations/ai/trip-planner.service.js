import { ApiError } from "../../common/errors/ApiError.js";
import { environment } from "../../config/environment.js";

const baseUrl = () => environment.TRIP_PLANNER_SERVICE_URL.replace(/\/$/, "");

export const aiTripPlannerService = Object.freeze({
  async plan(input) {
    let response;
    try {
      response = await fetch(`${baseUrl()}/api/trip/plan`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(environment.AI_TRIP_PLAN_TIMEOUT_MS),
      });
    } catch (error) {
      throw ApiError.serviceUnavailable("AI trip planner is currently unavailable", {
        code: error?.name === "TimeoutError" ? "AI_TRIP_PLANNER_TIMEOUT" : "AI_TRIP_PLANNER_UNAVAILABLE",
        cause: error,
      });
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.detail || payload?.error || payload?.message || "AI trip planner request failed";
      if (response.status >= 500) {
        throw ApiError.serviceUnavailable(message, { code: "AI_TRIP_PLANNER_FAILED" });
      }
      throw ApiError.badRequest(message, { code: "AI_TRIP_PLANNER_REJECTED" });
    }

    if (!payload?.itinerary || !payload?.hotels) {
      throw ApiError.serviceUnavailable("AI trip planner returned an invalid response", {
        code: "AI_TRIP_PLANNER_INVALID_RESPONSE",
      });
    }

    return payload;
  },
});

export default aiTripPlannerService;
