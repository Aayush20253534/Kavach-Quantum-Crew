import { prisma } from "../../config/database.js";

const ACTIVE_INCIDENT_STATUSES = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"];

export const createDisasterManagementRepository = ({ db = prisma } = {}) => ({
  findResponderById(id) {
    return db.disasterManager.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        organization: true,
        department: true,
        jurisdiction: true,
        staffInfo: true,
        responderStatus: true,
        maxActiveIncidents: true,
        statusChangedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async listResponders({ status, organization, jurisdiction, limit }) {
    const responders = await db.disasterManager.findMany({
      where: {
        status: "ACTIVE",
        ...(status ? { responderStatus: status } : {}),
        ...(organization ? { organization: { equals: organization, mode: "insensitive" } } : {}),
        ...(jurisdiction ? { jurisdiction: { equals: jurisdiction, mode: "insensitive" } } : {}),
      },
      select: {
        id: true,
        name: true,
        organization: true,
        department: true,
        jurisdiction: true,
        responderStatus: true,
        maxActiveIncidents: true,
        statusChangedAt: true,
      },
      orderBy: [{ responderStatus: "asc" }, { name: "asc" }],
      take: limit,
    });

    if (!responders.length) return [];
    const ids = responders.map((responder) => responder.id);
    const workloads = await db.incident.groupBy({
      by: ["assignedToId"],
      where: {
        assignedToRole: "DISASTER_MANAGER",
        assignedToId: { in: ids },
        status: { in: ACTIVE_INCIDENT_STATUSES },
      },
      _count: { _all: true },
    });
    const byResponder = new Map(workloads.map((row) => [row.assignedToId, row._count._all]));

    return responders.map((responder) => ({
      ...responder,
      activeIncidentCount: byResponder.get(responder.id) ?? 0,
      atCapacity: (byResponder.get(responder.id) ?? 0) >= responder.maxActiveIncidents,
    }));
  },

  updateResponderStatus(id, responderStatus, now) {
    return db.disasterManager.update({
      where: { id },
      data: { responderStatus, statusChangedAt: now },
      select: {
        id: true,
        name: true,
        organization: true,
        department: true,
        jurisdiction: true,
        responderStatus: true,
        maxActiveIncidents: true,
        statusChangedAt: true,
      },
    });
  },

  countActiveAssignments(responderId) {
    return db.incident.count({
      where: {
        assignedToId: responderId,
        assignedToRole: "DISASTER_MANAGER",
        status: { in: ACTIVE_INCIDENT_STATUSES },
      },
    });
  },

  listAssignedIncidents(responderId, { status, severity, limit }) {
    return db.incident.findMany({
      where: {
        assignedToId: responderId,
        assignedToRole: "DISASTER_MANAGER",
        ...(status ? { status } : { status: { in: ACTIVE_INCIDENT_STATUSES } }),
        ...(severity ? { severity } : {}),
      },
      orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
      take: limit,
    });
  },

  async listIncidentQueue({ status, severity, scope, actorId, jurisdiction, limit }) {
    const assignmentFilter =
      scope === "MINE"
        ? { assignedToId: actorId, assignedToRole: "DISASTER_MANAGER" }
        : scope === "UNASSIGNED"
          ? { assignedToId: null }
          : {};

    // The command queue is a central emergency inbox. Do not hide incidents by
    // comparing a free-form trip destination (for example "Triveni Sangam")
    // with a responder jurisdiction string (for example "Prayagraj"). That
    // brittle text comparison caused valid SOS incidents to disappear entirely.
    // Jurisdiction remains available for dashboard/fleet scoping, while every
    // active incident is indexed in the disaster-management queue.
    void jurisdiction;

    const rows = await db.incident.findMany({
      where: {
        ...(status ? { status } : { status: { in: ACTIVE_INCIDENT_STATUSES } }),
        ...(severity ? { severity } : {}),
        ...assignmentFilter,
      },
      orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
      take: limit,
    });

    if (!rows.length) return [];
    const userIds = [...new Set(rows.map((row) => row.userId))];
    const tripIds = [...new Set(rows.map((row) => row.tripId))];
    const [tourists, trips] = await Promise.all([
      db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true, phone: true, email: true, nationality: true, preferredLanguage: true, bloodGroup: true, emergencyPhone: true },
      }),
      db.trip.findMany({ where: { id: { in: tripIds } }, select: { id: true, locationName: true, status: true } }),
    ]);
    const touristById = new Map(tourists.map((tourist) => [tourist.id, tourist]));
    const tripById = new Map(trips.map((trip) => [trip.id, trip]));
    return rows.map((row) => ({
      ...row,
      tourist: touristById.get(row.userId) ?? null,
      trip: tripById.get(row.tripId) ?? null,
      location: { latitude: row.latitude, longitude: row.longitude },
      priority: row.severity,
    }));
  },

  async getIncidentContext(id) {
    const incident = await db.incident.findUnique({ where: { id } });
    if (!incident) return null;
    const [tourist, trip] = await Promise.all([
      db.user.findUnique({ where: { id: incident.userId }, select: { id: true, name: true, username: true, phone: true, email: true, nationality: true, preferredLanguage: true, bloodGroup: true, emergencyPhone: true } }),
      db.trip.findUnique({ where: { id: incident.tripId }, select: { id: true, locationName: true, status: true } }),
    ]);
    return { ...incident, tourist, trip, location: { latitude: incident.latitude, longitude: incident.longitude }, priority: incident.severity };
  },

  async dashboard(responderId, jurisdiction = null) {
    const jurisdictionTripIds = jurisdiction
      ? (
          await db.trip.findMany({
            where: {
              locationName: {
                contains: jurisdiction,
                mode: "insensitive",
              },
            },
            select: { id: true },
          })
        ).map((trip) => trip.id)
      : null;

    const incidentJurisdictionFilter = jurisdictionTripIds
      ? { tripId: { in: jurisdictionTripIds } }
      : {};

    const activeFilter = {
      status: { in: ACTIVE_INCIDENT_STATUSES },
      ...incidentJurisdictionFilter,
    };

    const tripFilter = jurisdiction
      ? {
          status: "ACTIVE",
          locationName: {
            contains: jurisdiction,
            mode: "insensitive",
          },
        }
      : { status: "ACTIVE" };

    const unitFilter = jurisdiction
      ? {
          jurisdiction: {
            equals: jurisdiction,
            mode: "insensitive",
          },
        }
      : {};

    const responderFilter = jurisdiction
      ? {
          jurisdiction: {
            equals: jurisdiction,
            mode: "insensitive",
          },
        }
      : {};

    const [
      open,
      critical,
      unassigned,
      mine,
      resolvedToday,
      availableResponders,
      activeTrips,
      activeTripRows,
      emergencyUnits,
    ] = await Promise.all([
      db.incident.count({ where: activeFilter }),
      db.incident.count({ where: { ...activeFilter, severity: "CRITICAL" } }),
      db.incident.count({ where: { ...activeFilter, assignedToId: null } }),
      db.incident.count({
        where: {
          ...activeFilter,
          assignedToId: responderId,
          assignedToRole: "DISASTER_MANAGER",
        },
      }),
      db.incident.count({
        where: {
          status: "RESOLVED",
          resolvedAt: {
            gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
          },
          ...incidentJurisdictionFilter,
        },
      }),
      db.disasterManager.count({
        where: {
          status: "ACTIVE",
          responderStatus: "AVAILABLE",
          ...responderFilter,
        },
      }),
      db.trip.count({ where: tripFilter }),
      db.trip.findMany({
        where: tripFilter,
        distinct: ["touristId"],
        select: { touristId: true },
      }),
      db.emergencyUnit.findMany({
        where: unitFilter,
        orderBy: [{ type: "asc" }, { status: "asc" }, { name: "asc" }],
      }),
    ]);

    return {
      jurisdiction,
      openIncidents: open,
      criticalIncidents: critical,
      unassignedIncidents: unassigned,
      myActiveIncidents: mine,
      resolvedToday,
      availableResponders,
      activeTrips,
      activeTourists: activeTripRows.length,
      emergencyUnits,
    };
  },

  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({
      data: { actorId, actorRole, action, entityType: "DisasterManager", entityId, metadata },
    });
  },
});

export const disasterManagementRepository = createDisasterManagementRepository();
export default disasterManagementRepository;
