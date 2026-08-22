import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { hazardController } from "./hazard.controller.js";
import { createHazardBodySchema, hazardListQuerySchema, hazardModerationBodySchema, hazardParamsSchema, nearbyHazardQuerySchema } from "./hazard.validation.js";

export const createHazardRouter = ({ controller = hazardController } = {}) => {
  const router = Router();
  router.use(authenticate);
  router.post("/", authorize(ROLES.TOURIST), validate({ body: createHazardBodySchema }), asyncHandler(controller.create));
  router.get("/", authorize(ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ query: hazardListQuerySchema }), asyncHandler(controller.list));
  router.get("/nearby", authorize(ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ query: nearbyHazardQuerySchema }), asyncHandler(controller.nearby));
  router.get("/:hazardId", authorize(ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ params: hazardParamsSchema }), asyncHandler(controller.get));
  router.patch("/:hazardId/verify", authorize(ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ params: hazardParamsSchema, body: hazardModerationBodySchema }), asyncHandler(controller.verify));
  router.patch("/:hazardId/reject", authorize(ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ params: hazardParamsSchema, body: hazardModerationBodySchema }), asyncHandler(controller.reject));
  router.patch("/:hazardId/resolve", authorize(ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN), validate({ params: hazardParamsSchema, body: hazardModerationBodySchema }), asyncHandler(controller.resolve));
  return router;
};

export const hazardRouter = createHazardRouter();
export default hazardRouter;
