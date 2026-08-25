import { ApiError } from "../../common/errors/ApiError.js";
import { cloudinaryAdapter } from "../../integrations/cloudinary/cloudinary.adapter.js";
import { touristRepository } from "./tourist.repository.js";
import { blockchainIntegrityService } from "../../integrations/blockchain/blockchain.integrity.service.js";

const toProfile = (user) => ({
  id: user.id,
  profilePic: user.profilePicUrl ?? null,
  username: user.username,
  name: user.name,
  email: user.email,
  emailVerified: Boolean(user.emailVerifiedAt),
  phone: user.phone,
  emergencyContact: user.emergencyPhone ?? null,
  gender: user.gender ?? null,
  nationality: user.nationality ?? null,
  age: user.age ?? null,
  dateOfBirth: user.dateOfBirth ?? null,
  medicalHistory: user.medicalHistory ?? null,
  medicalDocumentUrl: user.medicalDocumentUrl ?? null,
  medicalDocumentName: user.medicalDocumentName ?? null,
  preferredLanguage: user.preferredLanguage ?? null,
  emergencyContactName: user.emergencyContactName ?? null,
  emergencyContactRelation: user.emergencyContactRelation ?? null,
  bloodGroup: user.bloodGroup ?? null,
  governmentIdType: user.governmentIdType ?? null,
  governmentIdNumber: user.governmentIdNumber ?? null,
  liveTrackingEnabled: user.liveTrackingEnabled,
  geoAlertsEnabled: user.geoAlertsEnabled,
  onboardingCompleted: user.onboardingCompleted,
});

export const createTouristService = ({
  repository = touristRepository,
  imageStorage = cloudinaryAdapter,
} = {}) =>
  Object.freeze({
    async getProfile(userId) {
      await blockchainIntegrityService.reconcileUser(userId).catch(() => false);
      const user = await repository.findByUserId(userId);
      if (!user) {
        throw ApiError.notFound("Tourist account not found", {
          code: "TOURIST_NOT_FOUND",
        });
      }
      const openTrip = await repository.findOpenTrip(userId);
      return { ...toProfile(user), tripIdentityLocked: Boolean(openTrip) };
    },

    async completeOnboarding(userId, input) {
      const user = await repository.findByUserId(userId);
      if (!user) {
        throw ApiError.notFound("Tourist account not found", {
          code: "TOURIST_NOT_FOUND",
        });
      }

      if (user.onboardingCompleted) {
        throw ApiError.conflict("Tourist onboarding is already complete", {
          code: "ONBOARDING_ALREADY_COMPLETED",
        });
      }

      const updated = await repository.completeOnboarding(userId, {
        gender: input.gender,
        age: input.age,
        dateOfBirth: input.dateOfBirth,
        medicalHistory: input.medicalHistory || null,
        emergencyPhone: input.emergencyPhone,
        nationality: input.nationality,
        preferredLanguage: input.preferredLanguage,
        emergencyContactName: input.emergencyContactName,
        emergencyContactRelation: input.emergencyContactRelation,
        bloodGroup: input.bloodGroup,
        governmentIdType: input.governmentIdType,
        governmentIdNumber: input.governmentIdNumber,
        liveTrackingEnabled: input.liveTrackingEnabled,
        geoAlertsEnabled: input.geoAlertsEnabled,
      });
      return toProfile(updated);
    },

    async updateMedicalDocument(userId, file) {
      const existing = await repository.findByUserId(userId);
      if (!existing) {
        throw ApiError.notFound("Tourist account not found", {
          code: "TOURIST_NOT_FOUND",
        });
      }

      const uploaded = await imageStorage.uploadTouristMedicalDocument({
        userId,
        file,
      });

      const updated = await repository.updateProfile(userId, {
        medicalDocumentUrl: uploaded.url,
        medicalDocumentName: uploaded.name,
      });

      return {
        profile: toProfile(updated),
        document: uploaded,
      };
    },

    async updateProfileImage(userId, file) {
      const existing = await repository.findByUserId(userId);
      if (!existing) {
        throw ApiError.notFound("Tourist account not found", {
          code: "TOURIST_NOT_FOUND",
        });
      }

      if (!existing.onboardingCompleted) {
        throw ApiError.badRequest(
          "Complete onboarding before uploading a profile image",
          { code: "ONBOARDING_REQUIRED" },
        );
      }

      const uploaded = await imageStorage.uploadTouristProfileImage({
        userId,
        file,
      });

      const updated = await repository.updateProfile(userId, {
        profilePicUrl: uploaded.url,
      });

      return {
        profile: toProfile(updated),
        image: uploaded,
      };
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

      const openTrip = await repository.findOpenTrip(userId);
      const immutableFields = ["name", "dateOfBirth", "email", "phone"];
      const attemptedImmutableChange = openTrip && immutableFields.some((field) => {
        if (input[field] === undefined) return false;
        if (field === "dateOfBirth") return new Date(input[field]).toISOString() !== new Date(existing[field]).toISOString();
        return input[field] !== existing[field];
      });
      if (attemptedImmutableChange) {
        throw ApiError.conflict("Name, date of birth, email and phone are immutable while a trip is planned or active", { code: "TRIP_IDENTITY_IMMUTABLE", details: { tripId: openTrip.id, fields: immutableFields } });
      }

      if (input.username && input.username !== existing.username) {
        const conflict = await repository.findUsernameConflict(input.username, userId);
        if (conflict) {
          throw ApiError.conflict("Username is already in use", {
            code: "USERNAME_ALREADY_EXISTS",
          });
        }
      }

      if (input.email && input.email !== existing.email) {
        const conflict = await repository.findEmailConflict(input.email, userId);
        if (conflict) {
          throw ApiError.conflict("Email is already in use", {
            code: "EMAIL_ALREADY_EXISTS",
          });
        }
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
      if (input.username !== undefined) data.username = input.username;
      const emailChanged =
        input.email !== undefined && input.email !== existing.email;
      if (input.email !== undefined) data.email = input.email;
      if (emailChanged) data.emailVerifiedAt = null;
      if (input.phone !== undefined) data.phone = input.phone;
      if (input.profilePicUrl !== undefined) data.profilePicUrl = input.profilePicUrl;
      if (input.gender !== undefined) data.gender = input.gender;
      if (input.age !== undefined) data.age = input.age;
      if (input.dateOfBirth !== undefined) data.dateOfBirth = input.dateOfBirth;
      if (input.medicalHistory !== undefined)
        data.medicalHistory = input.medicalHistory || null;
      if (input.emergencyPhone !== undefined) data.emergencyPhone = input.emergencyPhone;
      if (input.nationality !== undefined) data.nationality = input.nationality;
      if (input.preferredLanguage !== undefined)
        data.preferredLanguage = input.preferredLanguage;
      if (input.emergencyContactName !== undefined)
        data.emergencyContactName = input.emergencyContactName;
      if (input.emergencyContactRelation !== undefined)
        data.emergencyContactRelation = input.emergencyContactRelation;
      if (input.bloodGroup !== undefined) data.bloodGroup = input.bloodGroup;
      if (input.governmentIdType !== undefined)
        data.governmentIdType = input.governmentIdType;
      if (input.governmentIdNumber !== undefined)
        data.governmentIdNumber = input.governmentIdNumber;
      if (input.liveTrackingEnabled !== undefined)
        data.liveTrackingEnabled = input.liveTrackingEnabled;
      if (input.geoAlertsEnabled !== undefined)
        data.geoAlertsEnabled = input.geoAlertsEnabled;

      const updated = await repository.updateProfile(userId, data);
      if (emailChanged) await repository.revokeSessions?.(userId);
      return toProfile(updated);
    },
  });

export const touristService = createTouristService();
export default touristService;
