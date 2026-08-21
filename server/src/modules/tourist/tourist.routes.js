import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { touristController } from "./tourist.controller.js";
import {
  onboardingBodySchema,
  updateTouristProfileBodySchema,
} from "./tourist.validation.js";

export const createTouristRouter = ({ controller = touristController } = {}) => {
  const router = Router();

  router.use(authenticate, authorize(ROLES.TOURIST));
  router.get("/me", asyncHandler(controller.getMe));
  router.post(
    "/me/onboarding",
    validate({ body: onboardingBodySchema }),
    asyncHandler(controller.onboarding),
  );
  router.patch(
    "/me",
    validate({ body: updateTouristProfileBodySchema }),
    asyncHandler(controller.updateMe),
  );

  return router;
};

export const touristRouter = createTouristRouter();
export default touristRouter;
