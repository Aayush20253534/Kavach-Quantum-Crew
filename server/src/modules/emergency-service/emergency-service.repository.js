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
  updateUnit: (id, data) => db.emergencyUnit.update({ where: { id }, data }),
  updateDispatch: (id, data) => db.dispatch.update({ where: { id }, include: { incident: true, unit: true } }),
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
