import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { profileImageUpload } from "../../middleware/upload.middleware.js";
import { systemAdminController } from "./system-admin.controller.js";
import {
  adminAccountListQuerySchema,
  adminAccountParamsSchema,
  adminAccountStatusBodySchema,
  adminDestinationCreateBodySchema,
  adminDestinationListQuerySchema,
  adminDestinationParamsSchema,
  adminDestinationUpdateBodySchema,
  adminResourceListQuerySchema,
  adminResourceParamsSchema,
} from "./system-admin.validation.js";

export const createSystemAdminRouter = ({ controller = systemAdminController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.SYSTEM_ADMIN));
  router.get("/dashboard", asyncHandler(controller.dashboard));
  router.get("/accounts", validate({ query: adminAccountListQuerySchema }), asyncHandler(controller.accounts));
  router.get("/accounts/:role/:accountId", validate({ params: adminAccountParamsSchema }), asyncHandler(controller.account));
  router.patch("/accounts/:role/:accountId/status", validate({ params: adminAccountParamsSchema, body: adminAccountStatusBodySchema }), asyncHandler(controller.status));
  router.get(
    "/destinations",
    validate({ query: adminDestinationListQuerySchema }),
    asyncHandler(controller.destinations),
  );
  router.post(
    "/destinations",
    validate({ body: adminDestinationCreateBodySchema }),
    asyncHandler(controller.createDestination),
  );
  router.patch(
    "/destinations/:destinationId",
    validate({
      params: adminDestinationParamsSchema,
      body: adminDestinationUpdateBodySchema,
    }),
    asyncHandler(controller.updateDestination),
  );
  router.delete(
    "/destinations/:destinationId",
    validate({ params: adminDestinationParamsSchema }),
    asyncHandler(controller.deleteDestination),
  );
  router.post(
    "/destinations/:destinationId/image",
    validate({ params: adminDestinationParamsSchema }),
    profileImageUpload,
    asyncHandler(controller.uploadDestinationImage),
  );
  router.get("/resources/:resource", validate({ params: adminResourceParamsSchema, query: adminResourceListQuerySchema }), asyncHandler(controller.resources));
  return router;
};

export const systemAdminRouter = createSystemAdminRouter();
export default systemAdminRouter;
