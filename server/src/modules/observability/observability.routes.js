import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { observabilityController } from "./observability.controller.js";

export const createObservabilityRouter = ({ controller = observabilityController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.SYSTEM_ADMIN));
  router.get("/metrics", controller.metrics);
  router.get("/diagnostics", asyncHandler(controller.diagnostics));
  return router;
};

export const observabilityRouter = createObservabilityRouter();
export default observabilityRouter;
