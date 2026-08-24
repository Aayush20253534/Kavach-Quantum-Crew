import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { credentialController } from "./credential.controller.js";
import { groupCredentialParamsSchema, tripCredentialParamsSchema, verifyCredentialParamsSchema } from "./credential.validation.js";

export const createCredentialRouter = () => {
  const router = Router();
  router.get("/verify/:token", validate({ params: verifyCredentialParamsSchema }), asyncHandler(credentialController.verify));
  router.use(authenticate, authorize(ROLES.TOURIST));
  router.get("/trips/:tripId/me", validate({ params: tripCredentialParamsSchema }), asyncHandler(credentialController.me));
  router.get("/groups/:groupId", validate({ params: groupCredentialParamsSchema }), asyncHandler(credentialController.group));
  return router;
};
