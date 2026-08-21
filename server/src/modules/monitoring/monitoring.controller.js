import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { monitoringService } from "./monitoring.service.js";

export const createMonitoringController = ({ service = monitoringService } = {}) => ({
  policy: async (request, response) => ApiResponse.success(response, { message: "Trip monitoring policy", data: await service.getPolicy(request.user, request.params.tripId) }),
  updatePolicy: async (request, response) => ApiResponse.success(response, { message: "Trip monitoring policy updated", data: await service.updatePolicy(request.user, request.params.tripId, request.body) }),
  evaluate: async (request, response) => ApiResponse.success(response, { message: "Advanced trip safety evaluation", data: await service.evaluateParticipant(request.user, request.params.tripId) }),
  sweep: async (request, response) => ApiResponse.success(response, { message: "Advanced monitoring sweep completed", data: await service.sweep(request.user, request.body.limit) }),
});

export const monitoringController = createMonitoringController();
export default monitoringController;
