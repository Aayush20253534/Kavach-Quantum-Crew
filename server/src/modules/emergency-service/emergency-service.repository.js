import { prisma } from "../../config/database.js";

export const createEmergencyServiceRepository = ({ db = prisma } = {}) => ({
  findConflict: async ({ username, email, phone }) => {
    const where = { OR: [{ username }, { email }, { phone }] };
    const rows = await Promise.all([
      db.user.findFirst({ where, select: { id: true } }),
      db.disasterManager.findFirst({ where, select: { id: true } }),
      db.systemAdmin.findFirst({ where, select: { id: true } }),
      db.emergencyServiceAccount.findFirst({ where, select: { id: true } }),
    ]);
    return rows.find(Boolean) ?? null;
  },
  createAudit: (data) => db.auditLog.create({ data }),
  createAccountWithUnit: (account, unit) => db.$transaction(async (tx) => {
    const created = await tx.emergencyServiceAccount.create({ data: account });
    const createdUnit = await tx.emergencyUnit.create({ data: { ...unit, serviceAccountId: created.id } });
    return { account: created, unit: createdUnit };
  }),
  findAccount: (id) => db.emergencyServiceAccount.findUnique({ where: { id }, include: { units: true } }),
  updateAccount: (id, data) => db.emergencyServiceAccount.update({ where: { id }, data }),
  updateOwnedUnitsLocation: (serviceAccountId, data) => db.emergencyUnit.updateMany({ where: { serviceAccountId }, data }),
  listDispatches: (serviceAccountId) => db.dispatch.findMany({
    where: { unit: { serviceAccountId } },
    include: { incident: true, unit: true, events: { orderBy: { createdAt: "asc" } } },
    orderBy: { requestedAt: "desc" },
  }),
  findDispatch: (id) => db.dispatch.findUnique({ where: { id }, include: { incident: true, unit: true, events: { orderBy: { createdAt: "asc" } } } }),
  findLatestTouristLocation: (tripId, userId) => db.latestTrustedLocation.findUnique({
    where: { tripId_userId: { tripId, userId } },
    select: { latitude: true, longitude: true, accuracyM: true, capturedAt: true, updatedAt: true },
  }),
  updateUnit: (id, data) => db.emergencyUnit.update({ where: { id }, data }),
  transitionDispatch: (id, data, event) => db.$transaction(async (tx) => {
    const dispatch = await tx.dispatch.update({
      where: { id },
      data,
      include: { incident: true, unit: true },
    });
    await tx.dispatchEvent.create({ data: event });
    return dispatch;
  }),
  resolveIncidentWhenResponsesComplete: (incidentId, actor, now) => db.$transaction(async (tx) => {
    const remaining = await tx.dispatch.count({
      where: {
        incidentId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
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
  updateDispatch: (id, data) => db.dispatch.update({ where: { id }, data, include: { incident: true, unit: true } }),
  createEvent: (data) => db.dispatchEvent.create({ data }),
  findTripParticipant: (tripId, userId) => db.trip.findFirst({
    where: { id: tripId, OR: [{ touristId: userId }, { group: { members: { some: { userId, leftAt: null } } } }] },
    select: { id: true },
  }),
  listTouristDispatches: async (userId) => {
    const trips = await db.trip.findMany({
      where: {
        OR: [
          { touristId: userId },
          { group: { members: { some: { userId, leftAt: null } } } },
        ],
      },
      select: { id: true },
    });

    const tripIds = trips.map((trip) => trip.id);

    return db.dispatch.findMany({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        incident: {
          OR: [
            { userId },
            ...(tripIds.length > 0 ? [{ tripId: { in: tripIds } }] : []),
          ],
        },
      },
      include: { incident: true, unit: true, events: { orderBy: { createdAt: "asc" } } },
      orderBy: { requestedAt: "desc" },
    });
  },
});

export const emergencyServiceRepository = createEmergencyServiceRepository();
