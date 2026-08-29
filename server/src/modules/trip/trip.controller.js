import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { tripService } from "./trip.service.js";
import { aiTripPlannerService } from "../../integrations/ai/trip-planner.service.js";

export const createTripController = ({ service = tripService, planner = aiTripPlannerService } = {}) => ({
  planWithAI: async (request, response) =>
    ApiResponse.success(response, {
      message: "AI trip plan generated",
      data: await planner.plan(request.body),
    }),

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
      data: await service.startTrip(request.user.id, request.params.tripId, request.body ?? {}),
    }),

  extend: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip extended",
      data: await service.extendTrip(
        request.user.id,
        request.params.tripId,
        request.body.plannedEndAt,
      ),
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
