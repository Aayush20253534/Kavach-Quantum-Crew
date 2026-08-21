import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { tripService } from "./trip.service.js";

export const createTripController = ({ service = tripService } = {}) => ({
  create: async (request, response) =>
    ApiResponse.success(response, {
      statusCode: 201,
      message: "Trip created",
      data: await service.createTrip(request.user.id, request.body),
    }),

  current: async (request, response) =>
    ApiResponse.success(response, {
      message: "Current trip",
      data: await service.getCurrentTrip(request.user.id),
    }),

  history: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip history",
      data: await service.getHistory(request.user.id, request.query),
    }),

  getById: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip",
      data: await service.getTrip(request.user.id, request.params.tripId),
    }),

  grantConsent: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip consent granted",
      data: await service.grantConsent(
        request.user.id,
        request.params.tripId,
        request.body.type,
      ),
    }),

  revokeConsent: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip consent revoked",
      data: await service.revokeConsent(
        request.user.id,
        request.params.tripId,
        request.params.consentId,
      ),
    }),

  issueSafetyId: async (request, response) =>
    ApiResponse.success(response, {
      statusCode: 201,
      message: "Trip Safety ID issued",
      data: await service.issueSafetyId(request.user.id, request.params.tripId),
    }),

  start: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip started",
      data: await service.startTrip(request.user.id, request.params.tripId),
    }),

  complete: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip completed",
      data: await service.completeTrip(request.user.id, request.params.tripId),
    }),

  cancel: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip cancelled",
      data: await service.cancelTrip(request.user.id, request.params.tripId),
    }),
});

export const tripController = createTripController();
export default tripController;
