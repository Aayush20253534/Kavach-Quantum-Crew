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

const responseMinutes = (row) => {
  if (!row?.createdAt || !row?.startedAt) return null;
  const value =
    (new Date(row.startedAt).getTime() - new Date(row.createdAt).getTime()) / minute;
  return Number.isFinite(value) && value >= 0 ? value : null;
};

const buildDailyIncidentVolume = (rows, range = {}) => {
  const from = range.from ? new Date(range.from) : new Date(Date.now() - 29 * 24 * 60 * minute);
  const to = range.to ? new Date(range.to) : new Date();

  from.setUTCHours(0, 0, 0, 0);
  to.setUTCHours(23, 59, 59, 999);

  const counts = new Map();
  for (const row of rows) {
    const key = new Date(row.createdAt).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const result = [];
  for (let cursor = new Date(from); cursor <= to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({
      date: key,
      count: counts.get(key) || 0,
    });
  }

  return result;
};

const buildResponseDistribution = (rows) => {
  const buckets = [
    { key: "UNDER_2", label: "< 2 minutes", min: 0, max: 2 },
    { key: "TWO_TO_FIVE", label: "2 - 5 minutes", min: 2, max: 5 },
    { key: "FIVE_TO_TEN", label: "5 - 10 minutes", min: 5, max: 10 },
    { key: "OVER_10", label: "> 10 minutes", min: 10, max: Infinity },
  ];

  const values = rows.map(responseMinutes).filter((value) => value !== null);
  const total = values.length;

  return buckets.map((bucket) => {
    const count = values.filter(
      (value) => value >= bucket.min && value < bucket.max,
    ).length;

    return {
      key: bucket.key,
      label: bucket.label,
      count,
      percentage: total ? Number(((count / total) * 100).toFixed(1)) : 0,
    };
  });
};

const resolveIncidentScope = async (repository, actor) => {
  if (actor.role !== ROLES.DISASTER_MANAGER) {
    return { jurisdiction: null, tripIds: null };
  }

  const jurisdiction = await repository.responderJurisdiction(actor.id);

  // Incident command already treats the queue as a central operational inbox.
  // Do not scope analytics by comparing a free-form trip destination string with
  // the responder jurisdiction, otherwise valid incidents disappear from charts.
  return { jurisdiction, tripIds: null };
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
      const scope = await resolveIncidentScope(repository, actor);
      const data = await repository.incidentBreakdown(range, scope.tripIds);

      return {
        jurisdiction: scope.jurisdiction,
        byStatus: countMap(data.byStatus, "status"),
        bySeverity: countMap(data.bySeverity, "severity"),
        bySource: countMap(data.bySource, "sourceType"),
        dailyVolume: buildDailyIncidentVolume(data.timingRows, range),
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
      const scope = await resolveIncidentScope(repository, actor);
      const [incidents, dispatches] = await Promise.all([
        repository.incidentBreakdown(range, scope.tripIds),
        repository.dispatchBreakdown(range),
      ]);

      const responseDistribution = buildResponseDistribution(incidents.timingRows);
      const responded = responseDistribution.reduce((sum, bucket) => sum + bucket.count, 0);
      const withinFive = responseDistribution
        .filter((bucket) => bucket.key === "UNDER_2" || bucket.key === "TWO_TO_FIVE")
        .reduce((sum, bucket) => sum + bucket.count, 0);

      return {
        jurisdiction: scope.jurisdiction,
        incidents: {
          acknowledgeMinutes: averageMinutes(incidents.timingRows, "createdAt", "acknowledgedAt"),
          responseStartMinutes: averageMinutes(incidents.timingRows, "createdAt", "startedAt"),
          resolutionMinutes: averageMinutes(incidents.timingRows, "createdAt", "resolvedAt"),
          distribution: responseDistribution,
          respondedCount: responded,
          slaUnderFiveMinutesPercent: responded
            ? Number(((withinFive / responded) * 100).toFixed(1))
            : 0,
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
