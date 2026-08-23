import { zoneContainsPoint, zoneIsEffective } from "../../common/utils/geofence.js";
import { dashboardRepository } from "./dashboard.repository.js";

export const createDashboardService = ({ repository = dashboardRepository, clock = () => new Date() } = {}) => ({
  async touristSummary(userId, query) {
    const [totalTourists, activeAlerts, currentTrip, zones] = await Promise.all([
      repository.totalTourists(),
      repository.activeAlerts(userId),
      repository.currentTrip(userId),
      repository.activeRiskZones(),
    ]);

    let safetyStatus = { level: "UNKNOWN", zone: null };
    if (query.latitude !== undefined && query.longitude !== undefined) {
      const point = { latitude: query.latitude, longitude: query.longitude };
      const now = clock();
      const dangerZone = zones.find((zone) => zoneIsEffective(zone, now) && zoneContainsPoint(zone, point));
      safetyStatus = dangerZone
        ? { level: "DANGER", zone: { id: dangerZone.id, name: dangerZone.name, severity: dangerZone.severity } }
        : { level: "SAFE", zone: null };
    }

    return {
      totalTourists,
      activeAlerts,
      safetyStatus,
      currentGroupMembers: currentTrip?.group?.members?.length ?? 0,
      currentTrip: currentTrip
        ? { id: currentTrip.id, locationName: currentTrip.locationName, tripType: currentTrip.tripType, status: currentTrip.status }
        : null,
    };
  },
});

export const dashboardService = createDashboardService();
export default dashboardService;
