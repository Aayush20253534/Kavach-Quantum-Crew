import { prisma } from "../../config/database.js";
import { ROLES } from "../../constants/roles.js";

const accountDelegate = (db, role) => {
  if (role === ROLES.TOURIST) return db.user;
  if (role === ROLES.DISASTER_MANAGER) return db.disasterManager;
  if (role === ROLES.SYSTEM_ADMIN) return db.systemAdmin;
  return null;
};

const accountSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

const resourceConfig = Object.freeze({
  trips: { delegate: "trip", status: true, orderBy: { createdAt: "desc" } },
  groups: { delegate: "tripGroup", status: true, orderBy: { createdAt: "desc" } },
  incidents: { delegate: "incident", status: true, orderBy: { createdAt: "desc" } },
  hazards: { delegate: "hazardReport", status: true, orderBy: { createdAt: "desc" } },
  "risk-zones": { delegate: "safetyZone", status: false, orderBy: { createdAt: "desc" } },
  "emergency-units": { delegate: "emergencyUnit", status: true, orderBy: { createdAt: "desc" } },
  dispatches: { delegate: "dispatch", status: true, orderBy: { createdAt: "desc" } },
});

export const createSystemAdminRepository = ({ db = prisma } = {}) => ({
  async dashboard() {
    const [tourists, managers, activeTrips, openIncidents, criticalIncidents, pendingHazards, availableUnits, activeDispatches] = await Promise.all([
      db.user.count(),
      db.disasterManager.count(),
      db.trip.count({ where: { status: "ACTIVE" } }),
      db.incident.count({ where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
      db.incident.count({ where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] }, severity: "CRITICAL" } }),
      db.hazardReport.count({ where: { status: "PENDING" } }),
      db.emergencyUnit.count({ where: { status: "AVAILABLE" } }),
      db.dispatch.count({ where: { status: { in: ["REQUESTED", "ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE"] } } }),
    ]);
    return { tourists, disasterManagers: managers, activeTrips, openIncidents, criticalIncidents, pendingHazards, availableEmergencyUnits: availableUnits, activeDispatches };
  },

  async listAccounts({ role, status, search, limit }) {
    const roles = role ? [role] : [ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN];
    const results = await Promise.all(roles.map(async (currentRole) => {
      const delegate = accountDelegate(db, currentRole);
      const rows = await delegate.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(search ? { OR: [
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ] } : {}),
        },
        select: accountSelect,
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map((row) => ({ ...row, role: currentRole }));
    }));
    return results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  },

  findAccount(role, id) {
    const delegate = accountDelegate(db, role);
    return delegate?.findUnique({ where: { id }, select: accountSelect });
  },

  async updateAccountStatus(role, id, status) {
    const delegate = accountDelegate(db, role);
    const account = await delegate.update({ where: { id }, data: { status }, select: accountSelect });
    if (status !== "ACTIVE") {
      await db.authSession.updateMany({ where: { accountId: id, accountRole: role, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    return { ...account, role };
  },

  listResource(resource, { status, limit }) {
    const config = resourceConfig[resource];
    if (!config) return null;
    return db[config.delegate].findMany({
      where: status && config.status ? { status } : {},
      orderBy: config.orderBy,
      take: limit,
    });
  },

  createAudit({ actorId, actorRole, action, entityType, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole, action, entityType, entityId, metadata } });
  },
});

export const systemAdminRepository = createSystemAdminRepository();
export default systemAdminRepository;
