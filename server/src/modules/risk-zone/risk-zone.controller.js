import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { riskZoneService } from "./risk-zone.service.js";

export const createRiskZoneController = ({ service = riskZoneService } = {}) => ({
  create: async (req, res) => ApiResponse.success(res, { statusCode: 201, message: "Risk zone created", data: await service.create(req.user, req.body) }),
  list: async (req, res) => ApiResponse.success(res, { message: "Risk zones", data: await service.list(req.user, req.query) }),
  get: async (req, res) => ApiResponse.success(res, { message: "Risk zone", data: await service.get(req.user, req.params.zoneId) }),
  update: async (req, res) => ApiResponse.success(res, { message: "Risk zone updated", data: await service.update(req.user, req.params.zoneId, req.body) }),
  activate: async (req, res) => ApiResponse.success(res, { message: "Risk zone activated", data: await service.setActive(req.user, req.params.zoneId, true) }),
  deactivate: async (req, res) => ApiResponse.success(res, { message: "Risk zone deactivated", data: await service.setActive(req.user, req.params.zoneId, false) }),
  evaluate: async (req, res) => ApiResponse.success(res, { message: "Geofence evaluation", data: await service.evaluate(req.user, req.body) }),
});

export const riskZoneController = createRiskZoneController();
