import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { disasterManagementService } from "./disaster-management.service.js";

export const createDisasterManagementController = ({ service = disasterManagementService } = {}) => ({
  dashboard: async (request, response) => ApiResponse.success(response, { message: "Disaster management dashboard", data: await service.dashboard(request.user) }),
  me: async (request, response) => ApiResponse.success(response, { message: "Responder profile", data: await service.me(request.user) }),
  responders: async (request, response) => ApiResponse.success(response, { message: "Responders", data: await service.listResponders(request.user, request.query) }),
  responder: async (request, response) => ApiResponse.success(response, { message: "Responder", data: await service.getResponder(request.user, request.params.responderId) }),
  updateStatus: async (request, response) => ApiResponse.success(response, { message: "Responder status updated", data: await service.updateMyStatus(request.user, request.body.status) }),
  myIncidents: async (request, response) => ApiResponse.success(response, { message: "My assigned incidents", data: await service.myIncidents(request.user, request.query) }),
  queue: async (request, response) => ApiResponse.success(response, { message: "Emergency queue", data: await service.queue(request.user, request.query) }),
  get: async (request, response) => ApiResponse.success(response, { message: "Incident", data: await service.get(request.user, request.params.incidentId) }),
  acknowledge: async (request, response) => ApiResponse.success(response, { message: "Incident acknowledged", data: await service.acknowledge(request.user, request.params.incidentId, request.body.note) }),
  start: async (request, response) => ApiResponse.success(response, { message: "Response started", data: await service.start(request.user, request.params.incidentId, request.body.note) }),
  resolve: async (request, response) => ApiResponse.success(response, { message: "Incident resolved", data: await service.resolve(request.user, request.params.incidentId, request.body.note) }),
});

export const disasterManagementController = createDisasterManagementController();
export default disasterManagementController;
