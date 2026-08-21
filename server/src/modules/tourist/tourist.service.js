import { ApiError } from "../../common/errors/ApiError.js";
import { touristRepository } from "./tourist.repository.js";

const toProfile = (user) => ({
  id: user.id,
  profilePic: user.profilePicUrl ?? null,
  username: user.username,
  name: user.name,
  email: user.email,
  phone: user.phone,
  emergencyContact: user.emergencyPhone ?? null,
  gender: user.gender ?? null,
  nationality: user.nationality ?? null,
  age: user.age ?? null,
  medicalHistory: user.medicalHistory ?? null,
  onboardingCompleted: user.onboardingCompleted,
});

export const createTouristService = ({ repository = touristRepository } = {}) =>
  Object.freeze({
    async getProfile(userId) {
      const user = await repository.findByUserId(userId);
      if (!user) {
        throw ApiError.notFound("Tourist account not found", {
          code: "TOURIST_NOT_FOUND",
        });
      }
      return toProfile(user);
    },

    async completeOnboarding(userId, input) {
      const user = await repository.findByUserId(userId);
      if (!user) {
        throw ApiError.notFound("Tourist account not found", {
          code: "TOURIST_NOT_FOUND",
        });
      }

      const updated = await repository.completeOnboarding(userId, {
        gender: input.gender,
        age: input.age,
        medicalHistory: input.medicalHistory || null,
        emergencyPhone: input.emergencyPhone,
        nationality: input.nationality,
      });
      return toProfile(updated);
    },

    async updateProfile(userId, input) {
      const existing = await repository.findByUserId(userId);
      if (!existing) {
        throw ApiError.notFound("Tourist account not found", {
          code: "TOURIST_NOT_FOUND",
        });
      }
      if (!existing.onboardingCompleted) {
        throw ApiError.badRequest("Complete onboarding before editing the profile", {
          code: "ONBOARDING_REQUIRED",
        });
      }

      if (input.phone && input.phone !== existing.phone) {
        const conflict = await repository.findPhoneConflict(input.phone, userId);
        if (conflict) {
          throw ApiError.conflict("Phone number is already in use", {
            code: "PHONE_ALREADY_EXISTS",
          });
        }
      }

      const data = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.phone !== undefined) data.phone = input.phone;
      if (input.profilePicUrl !== undefined) data.profilePicUrl = input.profilePicUrl;
      if (input.gender !== undefined) data.gender = input.gender;
      if (input.age !== undefined) data.age = input.age;
      if (input.medicalHistory !== undefined)
        data.medicalHistory = input.medicalHistory || null;
      if (input.emergencyPhone !== undefined) data.emergencyPhone = input.emergencyPhone;
      if (input.nationality !== undefined) data.nationality = input.nationality;

      return toProfile(await repository.updateProfile(userId, data));
    },
  });

export const touristService = createTouristService();
export default touristService;
