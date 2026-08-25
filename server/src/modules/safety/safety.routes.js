import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { safetyController } from "./safety.controller.js";
import {
  alertListQuerySchema,
  alertParamsSchema,
  checkInParamsSchema,
  createZoneBodySchema,
  scheduleCheckInBodySchema,
  tripParamsSchema,
  zoneListQuerySchema,
} from "./safety.validation.js";

export const createSafetyRouter = ({ controller = safetyController } = {}) => {
  const router = Router();
  router.use(authenticate);

  router.get(
    "/zones",
    validate({ query: zoneListQuerySchema }),
    asyncHandler(controller.zones),
  );
  router.post(
    "/zones",
    authorize(ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN),
    validate({ body: createZoneBodySchema }),
    asyncHandler(controller.createZone),
  );

  router.post(
    "/trips/:tripId/check-ins",
    authorize(ROLES.TOURIST),
    validate({ params: tripParamsSchema, body: scheduleCheckInBodySchema }),
    asyncHandler(controller.scheduleCheckIn),
  );
  router.get(
    "/trips/:tripId/check-ins",
    authorize(ROLES.TOURIST),
    validate({ params: tripParamsSchema }),
    asyncHandler(controller.checkIns),
  );
  router.post(
    "/check-ins/:checkInId/complete",
    authorize(ROLES.TOURIST),
    validate({ params: checkInParamsSchema }),
    asyncHandler(controller.completeCheckIn),
  );
  router.get(
    "/trips/:tripId/risk",
    authorize(ROLES.TOURIST),
    validate({ params: tripParamsSchema }),
    asyncHandler(controller.risk),
  );
  router.get(
    "/trips/:tripId/alerts",
    authorize(ROLES.TOURIST),
    validate({ params: tripParamsSchema, query: alertListQuerySchema }),
    asyncHandler(controller.alerts),
  );
  router.post(
    "/alerts/:alertId/acknowledge",
    authorize(ROLES.TOURIST),
    validate({ params: alertParamsSchema }),
    asyncHandler(controller.acknowledge),
  );

  return router;
};

export const safetyRouter = createSafetyRouter();
export default safetyRouter;
