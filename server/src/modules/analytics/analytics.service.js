import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { analyticsRepository } from "./analytics.repository.js";

const STAFF = new Set([ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN]);
const minute = 60_000;

const countMap = (rows, key) => Object.fromEntries(rows.map((row) => [row[key], row._count._all]));
const averageMinutes = (rows, startKey, endKey) => {
  const values = rows
    .filter((row) => row[startKey] && row[endKey])
    .map((row) => (new Date(row[endKey]).getTime() - new Date(row[startKey]).getTime()) / minute)
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
};

export const createAnalyticsService = ({ repository = analyticsRepository } = {}) => {
  const requireStaff = (actor) => {
    if (!STAFF.has(actor.role)) {
      throw ApiError.forbidden("Analytics access requires emergency staff", { code: "ANALYTICS_ACCESS_FORBIDDEN" });
    }
  };

  return Object.freeze({
    overview(actor, range) {
      requireStaff(actor);
      return repository.overview(range);
    },

    async incidents(actor, range) {
      requireStaff(actor);
      const data = await repository.incidentBreakdown(range);
      return {
        byStatus: countMap(data.byStatus, "status"),
        bySeverity: countMap(data.bySeverity, "severity"),
        bySource: countMap(data.bySource, "sourceType"),
        responseTimesMinutes: {
          acknowledge: averageMinutes(data.timingRows, "createdAt", "acknowledgedAt"),
          responseStart: averageMinutes(data.timingRows, "createdAt", "startedAt"),
          resolution: averageMinutes(data.timingRows, "createdAt", "resolvedAt"),
        },
      };
    },

    async trips(actor, range) {
      requireStaff(actor);
      const data = await repository.tripBreakdown(range);
      return { byStatus: countMap(data.byStatus, "status"), byType: countMap(data.byType, "tripType") };
    },

    async hazards(actor, range) {
      requireStaff(actor);
      const data = await repository.hazardBreakdown(range);
      return {
        byStatus: countMap(data.byStatus, "status"),
        byType: countMap(data.byType, "type"),
        bySeverity: countMap(data.bySeverity, "severity"),
      };
    },

    async sos(actor, range) {
      requireStaff(actor);
      return { byEmergencyType: countMap(await repository.sosBreakdown(range), "emergencyType") };
    },

    async dispatch(actor, range) {
      requireStaff(actor);
      const data = await repository.dispatchBreakdown(range);
      return {
        byStatus: countMap(data.byStatus, "status"),
        byUnitType: countMap(data.byUnitType, "requestedUnitType"),
        responseTimesMinutes: {
          assignment: averageMinutes(data.timingRows, "requestedAt", "assignedAt"),
          dispatch: averageMinutes(data.timingRows, "requestedAt", "dispatchedAt"),
          onScene: averageMinutes(data.timingRows, "requestedAt", "onSceneAt"),
          completion: averageMinutes(data.timingRows, "requestedAt", "completedAt"),
        },
      };
    },

    async responders(actor) {
      requireStaff(actor);
      const data = await repository.responderWorkload();
      const workloads = data.activeAssignments.map((row) => ({ responderId: row.assignedToId, activeIncidents: row._count._all }));
      return {
        byAvailability: countMap(data.byAvailability, "responderStatus"),
        activeAssignments: workloads,
        totalActiveAssignments: workloads.reduce((sum, row) => sum + row.activeIncidents, 0),
      };
    },

    async responseTimes(actor, range) {
      requireStaff(actor);
      const [incidents, dispatches] = await Promise.all([
        repository.incidentBreakdown(range),
        repository.dispatchBreakdown(range),
      ]);
      return {
        incidents: {
          acknowledgeMinutes: averageMinutes(incidents.timingRows, "createdAt", "acknowledgedAt"),
          responseStartMinutes: averageMinutes(incidents.timingRows, "createdAt", "startedAt"),
          resolutionMinutes: averageMinutes(incidents.timingRows, "createdAt", "resolvedAt"),
        },
        dispatch: {
          assignmentMinutes: averageMinutes(dispatches.timingRows, "requestedAt", "assignedAt"),
          onSceneMinutes: averageMinutes(dispatches.timingRows, "requestedAt", "onSceneAt"),
          completionMinutes: averageMinutes(dispatches.timingRows, "requestedAt", "completedAt"),
        },
      };
    },
  });
};

export const analyticsService = createAnalyticsService();
export default analyticsService;
