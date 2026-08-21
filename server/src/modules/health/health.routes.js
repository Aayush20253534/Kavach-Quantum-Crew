import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { createHealthController } from "./health.controller.js";

export const createHealthRouter = (options = {}) => {
  const router = Router();
  const controller = createHealthController(options);

  router.get("/", controller.liveness);
  router.get("/live", controller.liveness);
  router.get("/ready", asyncHandler(controller.readiness));
  router.get("/readiness", asyncHandler(controller.readiness));
  router.get("/database", asyncHandler(controller.database));

  return router;
};

export const healthRouter = createHealthRouter();

export default healthRouter;
