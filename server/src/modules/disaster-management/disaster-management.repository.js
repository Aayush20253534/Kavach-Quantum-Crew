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

  listIncidentQueue({ status, severity, scope, actorId, limit }) {
    const assignmentFilter =
      scope === "MINE"
        ? { assignedToId: actorId, assignedToRole: "DISASTER_MANAGER" }
        : scope === "UNASSIGNED"
          ? { assignedToId: null }
          : {};

    return db.incident.findMany({
      where: {
        ...(status ? { status } : { status: { in: ACTIVE_INCIDENT_STATUSES } }),
        ...(severity ? { severity } : {}),
        ...assignmentFilter,
      },
      orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
      take: limit,
    });
  },

  async dashboard(responderId) {
    const activeFilter = { status: { in: ACTIVE_INCIDENT_STATUSES } };
    const [open, critical, unassigned, mine, resolvedToday, availableResponders] = await Promise.all([
      db.incident.count({ where: activeFilter }),
      db.incident.count({ where: { ...activeFilter, severity: "CRITICAL" } }),
      db.incident.count({ where: { ...activeFilter, assignedToId: null } }),
      db.incident.count({ where: { ...activeFilter, assignedToId: responderId, assignedToRole: "DISASTER_MANAGER" } }),
      db.incident.count({ where: { status: "RESOLVED", resolvedAt: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) } } }),
      db.disasterManager.count({ where: { status: "ACTIVE", responderStatus: "AVAILABLE" } }),
    ]);
    return { openIncidents: open, criticalIncidents: critical, unassignedIncidents: unassigned, myActiveIncidents: mine, resolvedToday, availableResponders };
  },

  createAudit({ actorId, actorRole, action, entityId, metadata }) {
    return db.auditLog.create({
      data: { actorId, actorRole, action, entityType: "DisasterManager", entityId, metadata },
    });
  },
});

export const disasterManagementRepository = createDisasterManagementRepository();
export default disasterManagementRepository;
