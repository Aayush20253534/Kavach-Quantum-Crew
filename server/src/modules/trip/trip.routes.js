import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { tripController } from "./trip.controller.js";
import {
  consentIdParamsSchema,
  createTripBodySchema,
  grantConsentBodySchema,
  extendTripBodySchema,
  tripHistoryQuerySchema,
  tripIdParamsSchema,
} from "./trip.validation.js";

export const createTripRouter = ({ controller = tripController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.TOURIST));

  router.post("/", validate({ body: createTripBodySchema }), asyncHandler(controller.create));
  router.get(
    "/current",
    asyncHandler(controller.current),
  );
  router.get(
    "/history",
    validate({ query: tripHistoryQuerySchema }),
    asyncHandler(controller.history),
  );
  router.get(
    "/:tripId",
    validate({ params: tripIdParamsSchema }),
    asyncHandler(controller.getById),
  );
  router.post(
    "/:tripId/consents",
    validate({ params: tripIdParamsSchema, body: grantConsentBodySchema }),
    asyncHandler(controller.grantConsent),
  );
  router.delete(
    "/:tripId/consents/:consentId",
    validate({ params: consentIdParamsSchema }),
    asyncHandler(controller.revokeConsent),
  );
  router.post(
    "/:tripId/safety-id",
    validate({ params: tripIdParamsSchema }),
    asyncHandler(controller.issueSafetyId),
  );
  router.post(
    "/:tripId/start",
    validate({ params: tripIdParamsSchema }),
    asyncHandler(controller.start),
  );
  router.post(
    "/:tripId/extend",
    validate({ params: tripIdParamsSchema, body: extendTripBodySchema }),
    asyncHandler(controller.extend),
  );
  router.post(
    "/:tripId/complete",
    validate({ params: tripIdParamsSchema }),
    asyncHandler(controller.complete),
  );
  router.post(
    "/:tripId/cancel",
    validate({ params: tripIdParamsSchema }),
    asyncHandler(controller.cancel),
  );

  return router;
};

export const tripRouter = createTripRouter();
export default tripRouter;
