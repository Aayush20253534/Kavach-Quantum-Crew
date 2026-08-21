import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";

import { notificationDeliveryController } from "./notification-delivery.controller.js";
import {
  enqueueNotificationDeliveryBodySchema,
  notificationDeliveryListQuerySchema,
  notificationDeliveryNotificationParamsSchema,
  notificationDeliveryParamsSchema,
  processNotificationDeliveriesBodySchema,
} from "./notification-delivery.validation.js";

export const createNotificationDeliveryRouter = ({ controller = notificationDeliveryController } = {}) => {
  const router = Router();
  router.use(authenticate);

  router.get("/capabilities", asyncHandler(controller.capabilities));
  router.get("/", validate({ query: notificationDeliveryListQuerySchema }), asyncHandler(controller.list));
  router.post(
    "/notifications/:notificationId",
    validate({ params: notificationDeliveryNotificationParamsSchema, body: enqueueNotificationDeliveryBodySchema }),
    asyncHandler(controller.enqueue),
  );
  router.post(
    "/process-due",
    validate({ body: processNotificationDeliveriesBodySchema }),
    asyncHandler(controller.processDue),
  );
  router.get(
    "/:deliveryId",
    validate({ params: notificationDeliveryParamsSchema }),
    asyncHandler(controller.get),
  );
  router.post(
    "/:deliveryId/retry",
    validate({ params: notificationDeliveryParamsSchema }),
    asyncHandler(controller.retry),
  );

  return router;
};

export default createNotificationDeliveryRouter;
