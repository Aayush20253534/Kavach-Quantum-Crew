import { prisma } from "../../config/database.js";

export const createTouristRepository = ({ db = prisma } = {}) => ({
  findByUserId(userId) {
    return db.user.findUnique({ where: { id: userId } });
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
});

export const touristRepository = createTouristRepository();
export default touristRepository;
