import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { analyticsController } from "./analytics.controller.js";
import { analyticsRangeQuerySchema } from "./analytics.validation.js";

export const createAnalyticsRouter = ({ controller = analyticsController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN));
  router.get("/overview", validate({ query: analyticsRangeQuerySchema }), asyncHandler(controller.overview));
  router.get("/incidents", validate({ query: analyticsRangeQuerySchema }), asyncHandler(controller.incidents));
  router.get("/trips", validate({ query: analyticsRangeQuerySchema }), asyncHandler(controller.trips));
  router.get("/hazards", validate({ query: analyticsRangeQuerySchema }), asyncHandler(controller.hazards));
  router.get("/sos", validate({ query: analyticsRangeQuerySchema }), asyncHandler(controller.sos));
  router.get("/dispatch", validate({ query: analyticsRangeQuerySchema }), asyncHandler(controller.dispatch));
  router.get("/responders", asyncHandler(controller.responders));
  router.get("/response-times", validate({ query: analyticsRangeQuerySchema }), asyncHandler(controller.responseTimes));
  return router;
};

export const analyticsRouter = createAnalyticsRouter();
export default analyticsRouter;
