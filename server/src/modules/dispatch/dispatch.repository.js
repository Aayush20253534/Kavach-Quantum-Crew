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
  findIncident: (id) => db.incident.findUnique({ where: { id } }),
  createDispatch: (data) => db.dispatch.create({ data, include: { incident: true, unit: { include: { serviceAccount: true } } } }),
  findDispatch: (id) => db.dispatch.findUnique({ where: { id }, include: { incident: true, unit: { include: { serviceAccount: true } } } }),
  listForIncident: (incidentId) => db.dispatch.findMany({ where: { incidentId }, include: { incident: true, unit: { include: { serviceAccount: true } } }, orderBy: { createdAt: "desc" } }),
  updateDispatch: (id, data) => db.dispatch.update({ where: { id }, data, include: { incident: true, unit: { include: { serviceAccount: true } } } }),
  createEvent: (data) => db.dispatchEvent.create({ data }),
  createAudit: ({ actorId, actorRole, action, entityId, metadata }) => db.auditLog.create({ data: { actorId, actorRole, action, entityType: "Dispatch", entityId, metadata } }),
});

export const dispatchRepository = createDispatchRepository();
export default dispatchRepository;
