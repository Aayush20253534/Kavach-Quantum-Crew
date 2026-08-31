import { ApiError } from "../../common/errors/ApiError.js";
import { environment } from "../../config/environment.js";

const baseUrl = () => environment.TRIP_PLANNER_SERVICE_URL.replace(/\/$/, "");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isLocalPlannerUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const readPayload = async (response) => response.json().catch(() => null);

export const aiTripPlannerService = Object.freeze({
  async plan(input) {
    const plannerUrl = baseUrl();

    if (environment.NODE_ENV === "production" && isLocalPlannerUrl(plannerUrl)) {
      throw ApiError.serviceUnavailable(
        "AI trip planner is not configured for production. Set TRIP_PLANNER_SERVICE_URL to the deployed FastAPI service URL.",
        { code: "AI_TRIP_PLANNER_MISCONFIGURED" },
      );
    }

    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      let response;
      try {
        response = await fetch(`${plannerUrl}/api/trip/plan`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(environment.AI_TRIP_PLAN_TIMEOUT_MS),
        });
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await sleep(1500);
          continue;
        }
        throw ApiError.serviceUnavailable(
          error?.name === "TimeoutError"
            ? "AI trip planner timed out while starting or generating the itinerary. Retry once the planner service is awake."
            : "AI trip planner could not be reached. Check TRIP_PLANNER_SERVICE_URL and the FastAPI Render service.",
          {
            code: error?.name === "TimeoutError" ? "AI_TRIP_PLANNER_TIMEOUT" : "AI_TRIP_PLANNER_UNAVAILABLE",
            cause: error,
          },
        );
      }

      const payload = await readPayload(response);

      if (!response.ok) {
        const message = payload?.detail || payload?.error || payload?.message || `AI trip planner returned HTTP ${response.status}`;
        if (response.status >= 500 && attempt < 2) {
          lastError = new Error(message);
          await sleep(1500);
          continue;
        }
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
    }

    throw ApiError.serviceUnavailable(lastError?.message || "AI trip planner is currently unavailable", {
      code: "AI_TRIP_PLANNER_UNAVAILABLE",
    });
  },
});

export default aiTripPlannerService;
