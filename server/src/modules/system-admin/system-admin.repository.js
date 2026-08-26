import { prisma } from "../../config/database.js";
import { ROLES } from "../../constants/roles.js";

const accountDelegate = (db, role) => {
  if (role === ROLES.TOURIST) return db.user;
  if (role === ROLES.DISASTER_MANAGER) return db.disasterManager;
  if (role === ROLES.SYSTEM_ADMIN) return db.systemAdmin;
  if ([ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE].includes(role)) return db.emergencyServiceAccount;
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
    const [tourists, managers, activeTrips, openIncidents, criticalIncidents, pendingHazards, availableUnits, activeDispatches, activeDestinations] = await Promise.all([
      db.user.count(),
      db.disasterManager.count(),
      db.trip.count({ where: { status: "ACTIVE" } }),
      db.incident.count({ where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
      db.incident.count({ where: { status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] }, severity: "CRITICAL" } }),
      db.hazardReport.count({ where: { status: "PENDING" } }),
      db.emergencyUnit.count({ where: { status: "AVAILABLE" } }),
      db.dispatch.count({ where: { status: { in: ["REQUESTED", "ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE"] } } }),
      db.destination.count({ where: { active: true } }),
    ]);
    return { tourists, disasterManagers: managers, activeTrips, openIncidents, criticalIncidents, pendingHazards, availableEmergencyUnits: availableUnits, activeDispatches, activeDestinations };
  },

  async listAccounts({ role, status, search, limit }) {
    const roles = role ? [role] : [ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE];
    const results = await Promise.all(roles.map(async (currentRole) => {
      const delegate = accountDelegate(db, currentRole);
      const emergencyRole = [ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE].includes(currentRole);
      const rows = await delegate.findMany({
        where: {
          ...(emergencyRole ? { serviceType: currentRole } : {}),
          ...(status ? { status } : {}),
          ...(search ? { OR: [
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            ...(emergencyRole ? [{ organization: { contains: search, mode: "insensitive" } }] : []),
          ] } : {}),
        },
        select: emergencyRole
          ? { ...accountSelect, organization: true, serviceType: true, address: true, jurisdiction: true }
          : accountSelect,
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map((row) => ({ ...row, role: emergencyRole ? row.serviceType : currentRole }));
    }));
    return results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  },

  async findAccount(role, id) {
    const delegate = accountDelegate(db, role);
    if (!delegate) return null;
    const emergencyRole = [ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE].includes(role);
    const row = await delegate.findUnique({
      where: { id },
      select: emergencyRole ? { ...accountSelect, serviceType: true, organization: true, address: true, jurisdiction: true } : accountSelect,
    });
    return emergencyRole && row?.serviceType !== role ? null : row;
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

  listDestinations({ search, active, featured, limit }) {
    return db.destination.findMany({
      where: {
        ...(active === undefined ? {} : { active }),
        ...(featured === undefined ? {} : { featured }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { state: { contains: search, mode: "insensitive" } },
                { country: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: limit,
    });
  },

  findDestination(destinationId) {
    return db.destination.findUnique({ where: { id: destinationId } });
  },

  findDestinationConflict({ name, slug, excludeId }) {
    return db.destination.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          { slug },
        ],
      },
    });
  },

  createDestination(data) {
    return db.destination.create({ data });
  },

  updateDestination(destinationId, data) {
    return db.destination.update({
      where: { id: destinationId },
      data,
    });
  },

  deleteDestination(destinationId) {
    return db.destination.delete({ where: { id: destinationId } });
  },

  createAudit({ actorId, actorRole, action, entityType, entityId, metadata }) {
    return db.auditLog.create({ data: { actorId, actorRole, action, entityType, entityId, metadata } });
  },
});

export const systemAdminRepository = createSystemAdminRepository();
export default systemAdminRepository;
