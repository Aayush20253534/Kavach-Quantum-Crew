import { prisma } from "../../config/database.js";

const createdAtWhere = ({ from, to } = {}) => {
  if (!from && !to) return {};
  return { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } };
};

const requestedAtWhere = ({ from, to } = {}) => {
  if (!from && !to) return {};
  return { requestedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } };
};

export const createAnalyticsRepository = ({ db = prisma } = {}) => ({
  async overview(range) {
    const created = createdAtWhere(range);
    const [tourists, activeTrips, openIncidents, criticalIncidents, pendingHazards, activeDispatches, sosRequests] = await Promise.all([
      db.user.count({ where: { status: "ACTIVE" } }),
      db.trip.count({ where: { status: "ACTIVE", ...created } }),
      db.incident.count({ where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] }, ...created } }),
      db.incident.count({ where: { severity: "CRITICAL", ...created } }),
      db.hazardReport.count({ where: { status: "PENDING", ...created } }),
      db.dispatch.count({ where: { status: { in: ["REQUESTED", "ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE"] }, ...requestedAtWhere(range) } }),
      db.sosRequest.count({ where: created }),
    ]);
    return { tourists, activeTrips, openIncidents, criticalIncidents, pendingHazards, activeDispatches, sosRequests };
  },

  async incidentBreakdown(range, jurisdictionTripIds = null) {
    const where = {
      ...createdAtWhere(range),
      ...(jurisdictionTripIds ? { tripId: { in: jurisdictionTripIds } } : {}),
    };

    const [byStatus, bySeverity, bySource, timingRows] = await Promise.all([
      db.incident.groupBy({ by: ["status"], where, _count: { _all: true } }),
      db.incident.groupBy({ by: ["severity"], where, _count: { _all: true } }),
      db.incident.groupBy({ by: ["sourceType"], where, _count: { _all: true } }),
      db.incident.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          acknowledgedAt: true,
          startedAt: true,
          resolvedAt: true,
          dispatches: {
            select: {
              assignedAt: true,
              dispatchedAt: true,
              enRouteAt: true,
              onSceneAt: true,
              completedAt: true,
              status: true,
            },
            orderBy: { requestedAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const normalizedTimingRows = timingRows.map((row) => {
      const dispatches = Array.isArray(row.dispatches) ? row.dispatches : [];
      const firstTimestamp = (field) =>
        dispatches
          .map((dispatch) => dispatch[field])
          .filter(Boolean)
          .map((value) => new Date(value))
          .sort((a, b) => a - b)[0] ?? null;

      return {
        id: row.id,
        createdAt: row.createdAt,
        // Fleet assignment is a valid acknowledgement signal for operational
        // analytics when Disaster Management did not manually acknowledge first.
        acknowledgedAt: row.acknowledgedAt ?? firstTimestamp("assignedAt"),
        // A responder actually leaving the base is the practical response start.
        startedAt: row.startedAt ?? firstTimestamp("dispatchedAt") ?? firstTimestamp("enRouteAt"),
        // Incident resolution remains authoritative; completion is only a fallback
        // for legacy rows created before fleet completion auto-resolved incidents.
        resolvedAt: row.resolvedAt ?? firstTimestamp("completedAt"),
      };
    });

    return { byStatus, bySeverity, bySource, timingRows: normalizedTimingRows };
  },

  async jurisdictionTripIds(jurisdiction) {
    if (!jurisdiction) return null;

    const rows = await db.trip.findMany({
      where: {
        locationName: {
          contains: jurisdiction,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  },

  async responderJurisdiction(responderId) {
    if (!responderId) return null;
    const responder = await db.disasterManager.findUnique({
      where: { id: responderId },
      select: { jurisdiction: true },
    });
    return responder?.jurisdiction || null;
  },

  async tripBreakdown(range) {
    const where = createdAtWhere(range);
    const [byStatus, byType] = await Promise.all([
      db.trip.groupBy({ by: ["status"], where, _count: { _all: true } }),
      db.trip.groupBy({ by: ["tripType"], where, _count: { _all: true } }),
    ]);
    return { byStatus, byType };
  },

  async hazardBreakdown(range) {
    const where = createdAtWhere(range);
    const [byStatus, byType, bySeverity] = await Promise.all([
      db.hazardReport.groupBy({ by: ["status"], where, _count: { _all: true } }),
      db.hazardReport.groupBy({ by: ["type"], where, _count: { _all: true } }),
      db.hazardReport.groupBy({ by: ["severity"], where, _count: { _all: true } }),
    ]);
    return { byStatus, byType, bySeverity };
  },

  async sosBreakdown(range) {
    const where = createdAtWhere(range);
    return db.sosRequest.groupBy({ by: ["emergencyType"], where, _count: { _all: true } });
  },

  async dispatchBreakdown(range) {
    const where = requestedAtWhere(range);
    const [byStatus, byUnitType, timingRows] = await Promise.all([
      db.dispatch.groupBy({ by: ["status"], where, _count: { _all: true } }),
      db.dispatch.groupBy({ by: ["requestedUnitType"], where, _count: { _all: true } }),
      db.dispatch.findMany({ where, select: { requestedAt: true, assignedAt: true, dispatchedAt: true, onSceneAt: true, completedAt: true } }),
    ]);
    return { byStatus, byUnitType, timingRows };
  },

  async responderWorkload() {
    const [byAvailability, activeAssignments] = await Promise.all([
      db.disasterManager.groupBy({ by: ["responderStatus"], where: { status: "ACTIVE" }, _count: { _all: true } }),
      db.incident.groupBy({ by: ["assignedToId"], where: { assignedToRole: "DISASTER_MANAGER", assignedToId: { not: null }, status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } }, _count: { _all: true } }),
    ]);
    return { byAvailability, activeAssignments };
  },
});

export const analyticsRepository = createAnalyticsRepository();
export default analyticsRepository;
