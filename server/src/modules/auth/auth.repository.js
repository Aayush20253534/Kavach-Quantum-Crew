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
  emailVerifiedAt: true,
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
  if ([ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE].includes(role)) {
    return db.emergencyServiceAccount;
  }
  return null;
};

const selectForRole = (role) =>
  role === ROLES.TOURIST ? touristPublicSelect : publicAccountSelect;

export const createAuthRepository = ({ db = prisma } = {}) => ({
  async usernameExists(username) {
    const normalized = username.trim().toLowerCase();
    const [tourist, disasterManager, systemAdmin, emergencyService] = await Promise.all([
      db.user.findUnique({ where: { username: normalized }, select: { id: true } }),
      db.disasterManager.findUnique({ where: { username: normalized }, select: { id: true } }),
      db.systemAdmin.findUnique({ where: { username: normalized }, select: { id: true } }),
      db.emergencyServiceAccount.findUnique({ where: { username: normalized }, select: { id: true } }),
    ]);
    return Boolean(tourist || disasterManager || systemAdmin || emergencyService);
  },

  async findRegistrationConflict({ username, email, phone }) {
    const where = { OR: [{ username }, { email }, { phone }] };
    const [tourist, disasterManager, systemAdmin, emergencyService] = await Promise.all([
      db.user.findFirst({ where, select: { username: true, email: true, phone: true } }),
      db.disasterManager.findFirst({
        where,
        select: { username: true, email: true, phone: true },
      }),
      db.systemAdmin.findFirst({
        where,
        select: { username: true, email: true, phone: true },
      }),
      db.emergencyServiceAccount.findFirst({
        where,
        select: { username: true, email: true, phone: true },
      }),
    ]);
    return tourist ?? disasterManager ?? systemAdmin ?? emergencyService;
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
    if (systemAdmin) return withRole(systemAdmin, ROLES.SYSTEM_ADMIN);

    const emergencyService = await db.emergencyServiceAccount.findFirst({ where });
    if (!emergencyService) return null;
    return withRole(emergencyService, emergencyService.serviceType);
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

  findTouristByEmail(email) {
    return db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: touristPublicSelect,
    }).then((user) => withRole(user, ROLES.TOURIST));
  },

  async findAccountByEmail(email) {
    const normalized = email.trim().toLowerCase();
    const [tourist, disasterManager, systemAdmin, emergencyService] = await Promise.all([
      db.user.findUnique({ where: { email: normalized } }),
      db.disasterManager.findUnique({ where: { email: normalized } }),
      db.systemAdmin.findUnique({ where: { email: normalized } }),
      db.emergencyServiceAccount.findUnique({ where: { email: normalized } }),
    ]);
    if (tourist) return withRole(tourist, ROLES.TOURIST);
    if (disasterManager) return withRole(disasterManager, ROLES.DISASTER_MANAGER);
    if (systemAdmin) return withRole(systemAdmin, ROLES.SYSTEM_ADMIN);
    if (emergencyService) return withRole(emergencyService, emergencyService.serviceType);
    return null;
  },

  markTouristEmailVerified(id, verifiedAt = new Date()) {
    return db.user.update({
      where: { id },
      data: { emailVerifiedAt: verifiedAt },
      select: touristPublicSelect,
    }).then((user) => withRole(user, ROLES.TOURIST));
  },

  findEmailVerificationOtp(userId) {
    return db.emailVerificationOtp.findUnique({ where: { userId } });
  },

  upsertEmailVerificationOtp(userId, data) {
    return db.emailVerificationOtp.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  incrementEmailVerificationAttempts(userId) {
    return db.emailVerificationOtp.update({
      where: { userId },
      data: { attempts: { increment: 1 } },
    });
  },

  deleteEmailVerificationOtp(userId) {
    return db.emailVerificationOtp.deleteMany({ where: { userId } });
  },

  findPasswordResetOtp(accountId, accountRole) {
    return db.passwordResetOtp.findUnique({
      where: { accountId_accountRole: { accountId, accountRole } },
    });
  },

  upsertPasswordResetOtp(accountId, accountRole, data) {
    return db.passwordResetOtp.upsert({
      where: { accountId_accountRole: { accountId, accountRole } },
      create: { accountId, accountRole, ...data },
      update: data,
    });
  },

  incrementPasswordResetAttempts(accountId, accountRole) {
    return db.passwordResetOtp.update({
      where: { accountId_accountRole: { accountId, accountRole } },
      data: { attempts: { increment: 1 } },
    });
  },

  markPasswordResetVerified(accountId, accountRole, data) {
    return db.passwordResetOtp.update({
      where: { accountId_accountRole: { accountId, accountRole } },
      data,
    });
  },

  deletePasswordResetOtp(accountId, accountRole) {
    return db.passwordResetOtp.deleteMany({
      where: { accountId, accountRole },
    });
  },

  async updateAccountPassword(accountId, accountRole, passwordHash) {
    const delegate = accountDelegate(db, accountRole);
    if (!delegate) return null;
    return delegate.update({
      where: { id: accountId },
      data: { passwordHash },
    });
  },

  revokeAllSessions(accountId, accountRole, revokedAt = new Date()) {
    return db.authSession.updateMany({
      where: { accountId, accountRole, revokedAt: null },
      data: { revokedAt },
    });
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
