import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { destinationController } from "./destination.controller.js";
import { destinationQuerySchema } from "./destination.validation.js";

export const createDestinationRouter = ({ controller = destinationController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.TOURIST));
  router.get("/", validate({ query: destinationQuerySchema }), asyncHandler(controller.list));
  return router;
};

export default createDestinationRouter;
