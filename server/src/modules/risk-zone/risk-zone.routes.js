import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { riskZoneController } from "./risk-zone.controller.js";
import { createRiskZoneBodySchema, evaluateRiskZoneBodySchema, riskZoneListQuerySchema, riskZoneParamsSchema, updateRiskZoneBodySchema } from "./risk-zone.validation.js";

export const createRiskZoneRouter = ({ controller = riskZoneController } = {}) => {
  const router = Router();
  router.use(authenticate);
  router.get("/", authorize(ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ query: riskZoneListQuerySchema }), asyncHandler(controller.list));
  router.post("/evaluate", authorize(ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ body: evaluateRiskZoneBodySchema }), asyncHandler(controller.evaluate));
  router.post("/", authorize(ROLES.SYSTEM_ADMIN), validate({ body: createRiskZoneBodySchema }), asyncHandler(controller.create));
  router.get("/:zoneId", authorize(ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ params: riskZoneParamsSchema }), asyncHandler(controller.get));
  router.patch("/:zoneId", authorize(ROLES.SYSTEM_ADMIN), validate({ params: riskZoneParamsSchema, body: updateRiskZoneBodySchema }), asyncHandler(controller.update));
  router.post("/:zoneId/activate", authorize(ROLES.SYSTEM_ADMIN), validate({ params: riskZoneParamsSchema }), asyncHandler(controller.activate));
  router.post("/:zoneId/deactivate", authorize(ROLES.SYSTEM_ADMIN), validate({ params: riskZoneParamsSchema }), asyncHandler(controller.deactivate));
  return router;
};

export const riskZoneRouter = createRiskZoneRouter();
