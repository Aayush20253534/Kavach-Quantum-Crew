import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { emergencyServiceController } from "./emergency-service.controller.js";
import { emergencyDispatchParamsSchema, emergencyDispatchStatusBodySchema, emergencyLocationBodySchema, registerEmergencyServiceBodySchema } from "./emergency-service.validation.js";

export const createEmergencyServiceRouter = ({ controller = emergencyServiceController } = {}) => {
  const router = Router();
  router.post("/register", validate({ body: registerEmergencyServiceBodySchema }), asyncHandler(controller.register));
  router.get("/tracking/:dispatchId", authenticate, authorize(ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN, ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE), validate({ params: emergencyDispatchParamsSchema }), asyncHandler(controller.tracking));
  router.get("/tourist/dispatches", authenticate, authorize(ROLES.TOURIST), asyncHandler(controller.touristDispatches));
  router.use(authenticate, authorize(ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE));
  router.get("/me", asyncHandler(controller.me));
  router.patch("/me/location", validate({ body: emergencyLocationBodySchema }), asyncHandler(controller.updateLocation));
  router.get("/me/dispatches", asyncHandler(controller.dispatches));
  router.patch("/dispatches/:dispatchId/location", validate({ params: emergencyDispatchParamsSchema, body: emergencyLocationBodySchema }), asyncHandler(controller.updateDispatchLocation));
  router.patch("/dispatches/:dispatchId/status", validate({ params: emergencyDispatchParamsSchema, body: emergencyDispatchStatusBodySchema }), asyncHandler(controller.transition));
  return router;
};
export const emergencyServiceRouter = createEmergencyServiceRouter();
