import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { safetyService } from "./safety.service.js";

export const createSafetyController = ({ service = safetyService } = {}) => ({
  createZone: async (request, response) =>
    ApiResponse.success(response, {
      statusCode: 201,
      message: "Safety zone created",
      data: await service.createZone(request.user, request.body),
    }),

  zones: async (request, response) =>
    ApiResponse.success(response, {
      message: "Safety zones",
      data: await service.listZones(request.query),
    }),

  scheduleCheckIn: async (request, response) =>
    ApiResponse.success(response, {
      statusCode: 201,
      message: "Check-in scheduled",
      data: await service.scheduleCheckIn(request.user.id, request.params.tripId, request.body.dueAt),
    }),

  completeCheckIn: async (request, response) =>
    ApiResponse.success(response, {
      message: "Check-in completed",
      data: await service.completeCheckIn(request.user.id, request.params.checkInId),
    }),

  checkIns: async (request, response) =>
    ApiResponse.success(response, {
      message: "Trip check-ins",
      data: await service.listCheckIns(request.user.id, request.params.tripId),
    }),

  risk: async (request, response) =>
    ApiResponse.success(response, {
      message: "Deterministic safety risk",
      data: await service.getRisk(request.user.id, request.params.tripId),
    }),

  alerts: async (request, response) =>
    ApiResponse.success(response, {
      message: "Safety alerts",
      data: await service.listAlerts(request.user.id, request.params.tripId, request.query),
    }),

  acknowledge: async (request, response) =>
    ApiResponse.success(response, {
      message: "Safety alert acknowledged",
      data: await service.acknowledgeAlert(request.user.id, request.params.alertId),
    }),
});

export const safetyController = createSafetyController();
export default safetyController;
