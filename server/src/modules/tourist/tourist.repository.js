import { prisma } from "../../config/database.js";

export const createTouristRepository = ({ db = prisma } = {}) => ({
  findByUserId(userId) {
    return db.user.findUnique({ where: { id: userId } });
  },

  findUsernameConflict(username, exceptUserId) {
    return db.user.findFirst({
      where: { username, NOT: { id: exceptUserId } },
      select: { id: true },
    });
  },

  findEmailConflict(email, exceptUserId) {
    return db.user.findFirst({
      where: { email, NOT: { id: exceptUserId } },
      select: { id: true },
    });
  },

  findPhoneConflict(phone, exceptUserId) {
    return db.user.findFirst({
      where: { phone, NOT: { id: exceptUserId } },
      select: { id: true },
    });
  },

  completeOnboarding(userId, profile) {
    return db.user.update({
      where: { id: userId },
      data: { ...profile, onboardingCompleted: true },
    });
  },

  updateProfile(userId, data) {
    return db.user.update({ where: { id: userId }, data });
  },

  revokeSessions(userId) {
    return db.authSession.updateMany({
      where: { accountId: userId, accountRole: "TOURIST", revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
});

export const touristRepository = createTouristRepository();
export default touristRepository;
