import { prisma } from "../../config/database.js";
import { ROLES } from "../../constants/roles.js";

const publicAccountSelect = Object.freeze({
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
});

const touristPublicSelect = Object.freeze({
  ...publicAccountSelect,
  onboardingCompleted: true,
  profilePicUrl: true,
  gender: true,
  age: true,
  medicalHistory: true,
  emergencyPhone: true,
  nationality: true,
});

const withRole = (account, role) => (account ? { ...account, role } : null);

const accountDelegate = (db, role) => {
  if (role === ROLES.TOURIST) return db.user;
  if (role === ROLES.DISASTER_MANAGER) return db.disasterManager;
  if (role === ROLES.SYSTEM_ADMIN) return db.systemAdmin;
  return null;
};

const selectForRole = (role) =>
  role === ROLES.TOURIST ? touristPublicSelect : publicAccountSelect;

export const createAuthRepository = ({ db = prisma } = {}) => ({
  async findRegistrationConflict({ username, email, phone }) {
    const where = { OR: [{ username }, { email }, { phone }] };
    const [tourist, disasterManager, systemAdmin] = await Promise.all([
      db.user.findFirst({ where, select: { username: true, email: true, phone: true } }),
      db.disasterManager.findFirst({
        where,
        select: { username: true, email: true, phone: true },
      }),
      db.systemAdmin.findFirst({
        where,
        select: { username: true, email: true, phone: true },
      }),
    ]);
    return tourist ?? disasterManager ?? systemAdmin;
  },

  async createTourist(data) {
    const user = await db.user.create({ data, select: touristPublicSelect });
    return withRole(user, ROLES.TOURIST);
  },

  async findByLoginIdentifier(identifier) {
    const normalized = identifier.trim().toLowerCase();
    const where = { OR: [{ username: normalized }, { email: normalized }] };

    const tourist = await db.user.findFirst({ where });
    if (tourist) return withRole(tourist, ROLES.TOURIST);

    const disasterManager = await db.disasterManager.findFirst({ where });
    if (disasterManager) return withRole(disasterManager, ROLES.DISASTER_MANAGER);

    const systemAdmin = await db.systemAdmin.findFirst({ where });
    return withRole(systemAdmin, ROLES.SYSTEM_ADMIN);
  },

  async findPublicAccountById(id, role) {
    const delegate = accountDelegate(db, role);
    if (!delegate) return null;
    const account = await delegate.findUnique({
      where: { id },
      select: selectForRole(role),
    });
    return withRole(account, role);
  },

  async recordSuccessfulLogin(id, role) {
    const delegate = accountDelegate(db, role);
    if (!delegate) return null;
    const account = await delegate.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      select: selectForRole(role),
    });
    return withRole(account, role);
  },

  createSession(data) {
    return db.authSession.create({ data });
  },

  async findSession(id) {
    const session = await db.authSession.findUnique({ where: { id } });
    if (!session) return null;
    const account = await this.findPublicAccountById(
      session.accountId,
      session.accountRole,
    );
    return account ? { ...session, account } : { ...session, account: null };
  },

  rotateSession(id, data) {
    return db.authSession.update({ where: { id }, data });
  },

  revokeSession(id) {
    return db.authSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
});

export const authRepository = createAuthRepository();
export default authRepository;
