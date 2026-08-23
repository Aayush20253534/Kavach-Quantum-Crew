import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { dashboardController } from "./dashboard.controller.js";
import { touristDashboardQuerySchema } from "./dashboard.validation.js";

export const createDashboardRouter = ({ controller = dashboardController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.TOURIST));
  router.get("/tourist", validate({ query: touristDashboardQuerySchema }), asyncHandler(controller.tourist));
  return router;
};

export default createDashboardRouter;
