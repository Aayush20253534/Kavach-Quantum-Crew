import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { emergencyServiceService } from "./emergency-service.service.js";

export const createEmergencyServiceController = ({ service = emergencyServiceService } = {}) => ({
  register: async (req, res) => ApiResponse.success(res, { statusCode: 201, message: "Emergency service account created", data: await service.register(req.body) }),
  me: async (req, res) => ApiResponse.success(res, { message: "Emergency service profile", data: await service.me(req.user) }),
  updateLocation: async (req, res) => ApiResponse.success(res, { message: "Emergency service location updated", data: await service.updateLocation(req.user, req.body) }),
  dispatches: async (req, res) => ApiResponse.success(res, { message: "Assigned dispatches", data: await service.dispatches(req.user) }),
  updateDispatchLocation: async (req, res) => ApiResponse.success(res, { message: "Live dispatch location updated", data: await service.updateDispatchLocation(req.user, req.params.dispatchId, req.body) }),
  transition: async (req, res) => ApiResponse.success(res, { message: "Dispatch status updated", data: await service.transition(req.user, req.params.dispatchId, req.body.status, req.body.note) }),
  touristDispatches: async (req, res) => ApiResponse.success(res, { message: "Active emergency response dispatches", data: await service.listTouristDispatches(req.user) }),
  tracking: async (req, res) => ApiResponse.success(res, { message: "Live emergency response tracking", data: await service.tracking(req.user, req.params.dispatchId) }),
});
export const emergencyServiceController = createEmergencyServiceController();
