import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { analyticsService } from "./analytics.service.js";

const send = (response, data) => ApiResponse.success(response, { message: "Analytics retrieved", data });

export const analyticsController = Object.freeze({
  async overview(request, response) { return send(response, await analyticsService.overview(request.user, request.query)); },
  async incidents(request, response) { return send(response, await analyticsService.incidents(request.user, request.query)); },
  async trips(request, response) { return send(response, await analyticsService.trips(request.user, request.query)); },
  async hazards(request, response) { return send(response, await analyticsService.hazards(request.user, request.query)); },
  async sos(request, response) { return send(response, await analyticsService.sos(request.user, request.query)); },
  async dispatch(request, response) { return send(response, await analyticsService.dispatch(request.user, request.query)); },
  async responders(request, response) { return send(response, await analyticsService.responders(request.user)); },
  async responseTimes(request, response) { return send(response, await analyticsService.responseTimes(request.user, request.query)); },
});

export default analyticsController;
