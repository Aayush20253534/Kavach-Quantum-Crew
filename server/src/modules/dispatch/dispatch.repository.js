import { prisma } from "../../config/database.js";

export const createDispatchRepository = ({ db = prisma } = {}) => ({
  createUnit: (data) => db.emergencyUnit.create({ data }),
  listUnits: ({ type, status, jurisdiction, limit }) => db.emergencyUnit.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(jurisdiction
        ? {
            jurisdiction: {
              equals: jurisdiction,
              mode: "insensitive",
            },
          }
        : {}),
    },
    include: { serviceAccount: { select: { id: true, name: true, email: true, address: true, latitude: true, longitude: true } } },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    take: limit,
  }),
  findResponderJurisdiction: async (id) => {
    const responder = await db.disasterManager.findUnique({
      where: { id },
      select: { jurisdiction: true },
    });
    return responder?.jurisdiction || null;
  },
  listActiveDispatches: () => db.dispatch.findMany({ where: { status: { notIn: ["COMPLETED", "CANCELLED"] } }, include: { incident: true, unit: { include: { serviceAccount: true } }, events: { orderBy: { createdAt: "asc" } } }, orderBy: { requestedAt: "desc" } }),
  findUnit: (id) => db.emergencyUnit.findUnique({ where: { id } }),
  listAvailableUnitsByType: (type) => db.emergencyUnit.findMany({
    where: {
      type,
      status: "AVAILABLE",
      latitude: { not: null },
      longitude: { not: null },
    },
  }),
  updateUnit: (id, data) => db.emergencyUnit.update({ where: { id }, data }),
  findIncident: async (id) => {
    const incident = await db.incident.findUnique({ where: { id } });
    if (!incident) return null;
    const trip = await db.trip.findUnique({
      where: { id: incident.tripId },
      select: { id: true, status: true },
    });
    return { ...incident, trip };
  },
  createDispatch: (data) => db.dispatch.create({ data, include: { incident: true, unit: { include: { serviceAccount: true } } } }),
  findDispatch: async (id) => {
    const dispatch = await db.dispatch.findUnique({
      where: { id },
      include: { incident: true, unit: { include: { serviceAccount: true } } },
    });
    if (!dispatch) return null;
    const trip = await db.trip.findUnique({
      where: { id: dispatch.incident.tripId },
      select: { id: true, status: true },
    });
    return { ...dispatch, incident: { ...dispatch.incident, trip } };
  },
  listForIncident: (incidentId) => db.dispatch.findMany({ where: { incidentId }, include: { incident: true, unit: { include: { serviceAccount: true } } }, orderBy: { createdAt: "desc" } }),
  updateDispatch: (id, data) => db.dispatch.update({ where: { id }, data, include: { incident: true, unit: { include: { serviceAccount: true } } } }),
  createEvent: (data) => db.dispatchEvent.create({ data }),
  resolveIncidentWhenResponsesComplete: (incidentId, actor, now) => db.$transaction(async (tx) => {
    const remaining = await tx.dispatch.count({
      where: { incidentId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    });
    if (remaining > 0) return null;
    const incident = await tx.incident.findUnique({ where: { id: incidentId } });
    if (!incident || ["RESOLVED", "DISMISSED"].includes(incident.status)) return incident;
    const updated = await tx.incident.update({
      where: { id: incidentId },
      data: {
        status: "RESOLVED",
        resolvedById: actor.id,
        resolvedByRole: actor.role,
        resolvedAt: now,
        resolutionNote: "All assigned emergency fleet responses completed.",
      },
    });
    await tx.incidentEvent.create({
      data: {
        incidentId,
        type: "RESOLVED",
        actorId: actor.id,
        actorRole: actor.role,
        note: "Automatically resolved after all emergency fleet responses completed.",
        metadata: { automatic: true, source: "FLEET_COMPLETION" },
      },
    });
    return updated;
  }),
  createAudit: ({ actorId, actorRole, action, entityId, metadata }) => db.auditLog.create({ data: { actorId, actorRole, action, entityType: "Dispatch", entityId, metadata } }),
});

export const dispatchRepository = createDispatchRepository();
export default dispatchRepository;
