import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { observabilityService } from "./observability.service.js";

export const createObservabilityController = ({ service = observabilityService } = {}) => ({
  metrics(request, response) {
    return ApiResponse.success(response, {
      message: "Operational metrics retrieved",
      data: service.metrics(request.user),
    });
  },

  async diagnostics(request, response) {
    return ApiResponse.success(response, {
      message: "Operational diagnostics retrieved",
      data: await service.diagnostics(request.user),
    });
  },
});

export const observabilityController = createObservabilityController();
export default observabilityController;
