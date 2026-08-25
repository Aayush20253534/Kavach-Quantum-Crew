import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { monitoringController } from "./monitoring.controller.js";
import { monitoringPolicyBodySchema, monitoringSweepBodySchema, monitoringTripParamsSchema } from "./monitoring.validation.js";

export const createMonitoringRouter = ({ controller = monitoringController } = {}) => {
  const router = Router();
  router.use(authenticate);
  router.get("/trips/:tripId/policy", validate({ params: monitoringTripParamsSchema }), asyncHandler(controller.policy));
  router.patch("/trips/:tripId/policy", validate({ params: monitoringTripParamsSchema, body: monitoringPolicyBodySchema }), asyncHandler(controller.updatePolicy));
  router.post("/trips/:tripId/evaluate", authorize(ROLES.TOURIST), validate({ params: monitoringTripParamsSchema }), asyncHandler(controller.evaluate));
  router.post("/sweep", authorize(ROLES.SYSTEM_ADMIN), validate({ body: monitoringSweepBodySchema }), asyncHandler(controller.sweep));
  return router;
};

export const monitoringRouter = createMonitoringRouter();
export default monitoringRouter;
