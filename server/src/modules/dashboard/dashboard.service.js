import { zoneContainsPoint, zoneIntersectsCircle, zoneIsEffective } from "../../common/utils/geofence.js";
import { dashboardRepository } from "./dashboard.repository.js";

const settledValue = (result, fallback) =>
  result.status === "fulfilled" ? result.value : fallback;

export const createDashboardService = ({
  repository = dashboardRepository,
  clock = () => new Date(),
  logger = console,
} = {}) => ({
  async touristSummary(userId, query) {
    // These values are independent dashboard widgets. A failure in an optional
    // widget must not make the whole dashboard return HTTP 500.
    const results = await Promise.allSettled([
      repository.totalTourists(),
      repository.activeAlerts(userId),
      repository.currentTrip(userId),
      repository.activeRiskZones(),
    ]);

    const [touristsResult, alertsResult, tripResult, zonesResult] = results;

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const labels = ["totalTourists", "activeAlerts", "currentTrip", "activeRiskZones"];
        logger.error?.(`Dashboard metric failed: ${labels[index]}`, result.reason);
      }
    });

    const totalTourists = settledValue(touristsResult, 0);
    const activeAlerts = settledValue(alertsResult, 0);
    const currentTrip = settledValue(tripResult, null);
    const zones = settledValue(zonesResult, []);

    let safetyStatus = { level: "UNKNOWN", zone: null };

    if (query.latitude !== undefined && query.longitude !== undefined) {
      const point = {
        latitude: query.latitude,
        longitude: query.longitude,
      };
      const now = clock();

      const safetyRadiusM = currentTrip?.tripType === "GROUP" ? 500 : 0;

      const dangerZone = zones.find((zone) => {
        if (!zoneIsEffective(zone, now)) return false;

        return safetyRadiusM > 0
          ? zoneIntersectsCircle(zone, point, safetyRadiusM)
          : zoneContainsPoint(zone, point);
      });

      safetyStatus = dangerZone
        ? {
            level: "DANGER",
            zone: {
              id: dangerZone.id,
              name: dangerZone.name,
              severity: dangerZone.severity,
            },
          }
        : { level: "SAFE", zone: null };
    }

    return {
      totalTourists,
      activeAlerts,
      safetyStatus,
      currentGroupMembers: currentTrip?.group?.members?.length ?? 0,
      currentTrip: currentTrip
        ? {
            id: currentTrip.id,
            locationName: currentTrip.locationName,
            tripType: currentTrip.tripType,
            status: currentTrip.status,
          }
        : null,
    };
  },
});

export const dashboardService = createDashboardService();
export default dashboardService;
