import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { authController } from "./auth.controller.js";
import {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
  resendEmailVerificationBodySchema,
  verifyEmailBodySchema,
  usernameAvailabilityQuerySchema,
} from "./auth.validation.js";

export const createAuthRouter = ({ controller = authController } = {}) => {
  const router = Router();

  router.get(
    "/username-availability",
    validate({ query: usernameAvailabilityQuerySchema }),
    asyncHandler(controller.usernameAvailability),
  );

  router.post(
    "/register",
    validate({ body: registerBodySchema }),
    asyncHandler(controller.register),
  );
  router.post(
    "/verify-email",
    validate({ body: verifyEmailBodySchema }),
    asyncHandler(controller.verifyEmail),
  );
  router.post(
    "/resend-verification",
    validate({ body: resendEmailVerificationBodySchema }),
    asyncHandler(controller.resendEmailVerification),
  );
  router.post(
    "/login",
    validate({ body: loginBodySchema }),
    asyncHandler(controller.login),
  );
  router.post(
    "/refresh",
    validate({ body: refreshBodySchema }),
    asyncHandler(controller.refresh),
  );
  router.post(
    "/logout",
    validate({ body: logoutBodySchema }),
    asyncHandler(controller.logout),
  );
  router.get("/me", authenticate, asyncHandler(controller.me));

  return router;
};

export const authRouter = createAuthRouter();
export default authRouter;
