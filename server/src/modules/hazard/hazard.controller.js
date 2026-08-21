import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { hazardService } from "./hazard.service.js";

export const createHazardController = ({ service = hazardService } = {}) => ({
  create: async (request, response) => ApiResponse.success(response, { statusCode: 201, message: "Hazard reported", data: await service.create(request.user, request.body) }),
  list: async (request, response) => ApiResponse.success(response, { message: "Hazards", data: await service.list(request.user, request.query) }),
  nearby: async (request, response) => ApiResponse.success(response, { message: "Nearby verified hazards", data: await service.nearby(request.user, request.query) }),
  get: async (request, response) => ApiResponse.success(response, { message: "Hazard", data: await service.get(request.user, request.params.hazardId) }),
  verify: async (request, response) => ApiResponse.success(response, { message: "Hazard verified", data: await service.verify(request.user, request.params.hazardId, request.body.note) }),
  reject: async (request, response) => ApiResponse.success(response, { message: "Hazard rejected", data: await service.reject(request.user, request.params.hazardId, request.body.note) }),
  resolve: async (request, response) => ApiResponse.success(response, { message: "Hazard resolved", data: await service.resolve(request.user, request.params.hazardId, request.body.note) }),
});

export const hazardController = createHazardController();
export default hazardController;
