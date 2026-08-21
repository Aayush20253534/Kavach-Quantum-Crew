import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { healthService } from "./health.service.js";

const sendHealthResult = (response, result) =>
  ApiResponse.success(response, result);

export const createHealthController = ({ service = healthService } = {}) =>
  Object.freeze({
    liveness(_request, response) {
      return sendHealthResult(response, service.getLiveness());
    },

    async readiness(_request, response) {
      return sendHealthResult(response, await service.getReadiness());
    },

    async database(_request, response) {
      return sendHealthResult(response, await service.getDatabaseHealth());
    },
  });

export const healthController = createHealthController();

export default healthController;
