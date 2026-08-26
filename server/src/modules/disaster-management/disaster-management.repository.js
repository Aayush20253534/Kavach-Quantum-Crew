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

  async indexUnlinkedHazardReports() {
    // Older safety concern reports may predate the HazardReport -> Incident bridge.
    // Backfill them before serving the command queue so existing reports become
    // actionable incidents too, not a separate dead-end list.
    const hazards = await db.hazardReport.findMany({
      where: { status: { in: ["PENDING", "VERIFIED"] } },
      orderBy: { createdAt: "desc" },
      take: 250,
    });
    if (!hazards.length) return 0;

    const hazardIds = hazards.map((hazard) => hazard.id);
    const linkedEvents = await db.incidentEvent.findMany({
      where: { type: "CREATED" },
      select: { metadata: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    const linkedIds = new Set(
      linkedEvents
        .map((event) => event.metadata?.hazardReportId)
        .filter((id) => hazardIds.includes(id)),
    );

    let indexed = 0;
    for (const hazard of hazards) {
      if (linkedIds.has(hazard.id)) continue;

      const ownershipFilter = [
        { touristId: hazard.reporterId },
        { group: { is: { members: { some: { userId: hazard.reporterId } } } } },
      ];
      const trip =
        await db.trip.findFirst({
          where: { status: "ACTIVE", OR: ownershipFilter },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        }) ||
        await db.trip.findFirst({
          where: { OR: ownershipFilter },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
      if (!trip) continue;

      const incident = await db.incident.create({
        data: {
          tripId: trip.id,
          userId: hazard.reporterId,
          sourceType: "SAFETY_ALERT",
          severity:
            hazard.severity === "CRITICAL"
              ? "CRITICAL"
              : hazard.severity === "HIGH"
                ? "DANGER"
                : "WARNING",
          title: hazard.title,
          description: hazard.description,
          latitude: hazard.latitude,
          longitude: hazard.longitude,
        },
      });
      await db.incidentEvent.create({
        data: {
          incidentId: incident.id,
          type: "CREATED",
          actorId: hazard.reporterId,
          actorRole: hazard.reporterRole,
          metadata: {
            hazardReportId: hazard.id,
            hazardType: hazard.type,
            hazardSeverity: hazard.severity,
            locationName: hazard.locationName,
            backfilled: true,
          },
        },
      });
      indexed += 1;
    }
    return indexed;
  },

  async listIncidentQueue({ status, severity, scope, actorId, jurisdiction, limit }) {
    await this.indexUnlinkedHazardReports();

    const assignmentFilter =
      scope === "MINE"
        ? { assignedToId: actorId, assignedToRole: "DISASTER_MANAGER" }
        : scope === "UNASSIGNED"
          ? {
              assignedToId: null,
              dispatches: {
                none: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
              },
            }
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
    const incidentIds = rows.map((row) => row.id);
    const [tourists, trips, dispatches, creationEvents] = await Promise.all([
      db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true, phone: true, email: true, nationality: true, preferredLanguage: true, bloodGroup: true, emergencyPhone: true },
      }),
      db.trip.findMany({ where: { id: { in: tripIds } }, select: { id: true, locationName: true, status: true } }),
      db.dispatch.findMany({
        where: {
          incidentId: { in: incidentIds },
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
        include: {
          unit: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              organization: true,
              latitude: true,
              longitude: true,
              locationUpdatedAt: true,
              serviceAccountId: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
      }),
      db.incidentEvent.findMany({
        where: { incidentId: { in: incidentIds }, type: "CREATED" },
        select: { incidentId: true, metadata: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    const touristById = new Map(tourists.map((tourist) => [tourist.id, tourist]));
    const tripById = new Map(trips.map((trip) => [trip.id, trip]));
    const dispatchesByIncident = new Map();
    for (const dispatch of dispatches) {
      const list = dispatchesByIncident.get(dispatch.incidentId) ?? [];
      list.push(dispatch);
      dispatchesByIncident.set(dispatch.incidentId, list);
    }

    // A legacy hazard-backfill race could create more than one Incident for the
    // same HazardReport. Collapse those rows by their preserved hazardReportId
    // while leaving genuine repeated SOS incidents untouched.
    const originByIncident = new Map();
    for (const event of creationEvents) {
      if (!originByIncident.has(event.incidentId)) {
        originByIncident.set(event.incidentId, event.metadata ?? {});
      }
    }
    const seenHazardReports = new Set();
    const uniqueRows = rows.filter((row) => {
      const hazardReportId = originByIncident.get(row.id)?.hazardReportId;
      if (!hazardReportId) return true;
      if (seenHazardReports.has(hazardReportId)) return false;
      seenHazardReports.add(hazardReportId);
      return true;
    });

    return uniqueRows.map((row) => {
      const activeDispatches = dispatchesByIncident.get(row.id) ?? [];
      const trip = tripById.get(row.tripId) ?? null;
      const expired = Boolean(trip && trip.status !== "ACTIVE");
      return {
        ...row,
        tourist: touristById.get(row.userId) ?? null,
        trip,
        expired,
        displayStatus: expired && !["RESOLVED", "DISMISSED"].includes(row.status) ? "EXPIRED" : row.status,
        location: { latitude: row.latitude, longitude: row.longitude },
        priority: row.severity,
        activeDispatches,
        fleetAssigned: activeDispatches.some((dispatch) => Boolean(dispatch.unitId)),
      };
    });
  },

  async getIncidentContext(id) {
    const incident = await db.incident.findUnique({ where: { id } });
    if (!incident) return null;
    const [tourist, trip, activeDispatches] = await Promise.all([
      db.user.findUnique({ where: { id: incident.userId }, select: { id: true, name: true, username: true, phone: true, email: true, nationality: true, preferredLanguage: true, bloodGroup: true, emergencyPhone: true } }),
      db.trip.findUnique({ where: { id: incident.tripId }, select: { id: true, locationName: true, status: true } }),
      db.dispatch.findMany({
        where: {
          incidentId: id,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
        include: {
          unit: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              organization: true,
              latitude: true,
              longitude: true,
              locationUpdatedAt: true,
              serviceAccountId: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
      }),
    ]);
    const expired = Boolean(trip && trip.status !== "ACTIVE");
    return {
      ...incident,
      tourist,
      trip,
      expired,
      displayStatus: expired && !["RESOLVED", "DISMISSED"].includes(incident.status) ? "EXPIRED" : incident.status,
      activeDispatches,
      fleetAssigned: activeDispatches.some((dispatch) => Boolean(dispatch.unitId)),
      location: { latitude: incident.latitude, longitude: incident.longitude },
      priority: incident.severity,
    };
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
      db.incident.count({
        where: {
          ...activeFilter,
          assignedToId: null,
          dispatches: {
            none: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
          },
        },
      }),
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
