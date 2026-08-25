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
});

export const emergencyServiceRepository = createEmergencyServiceRepository();
