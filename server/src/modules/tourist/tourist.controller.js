import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { touristService } from "./tourist.service.js";

export const createTouristController = ({ service = touristService } = {}) => ({
  getMe: async (request, response) =>
    ApiResponse.success(response, {
      message: "Tourist profile",
      data: await service.getProfile(request.user.id),
    }),

  onboarding: async (request, response) =>
    ApiResponse.success(response, {
      message: "Onboarding completed",
      data: await service.completeOnboarding(request.user.id, request.body),
    }),

  updateMe: async (request, response) =>
    ApiResponse.success(response, {
      message: "Tourist profile updated",
      data: await service.updateProfile(request.user.id, request.body),
    }),

  uploadMedicalDocument: async (request, response) =>
    ApiResponse.success(response, {
      message: "Medical document uploaded",
      data: await service.updateMedicalDocument(
        request.user.id,
        request.file,
      ),
    }),

  uploadProfileImage: async (request, response) =>
    ApiResponse.success(response, {
      message: "Profile image uploaded",
      data: await service.updateProfileImage(
        request.user.id,
        request.file,
      ),
    }),
});

export const touristController = createTouristController();
export default touristController;
