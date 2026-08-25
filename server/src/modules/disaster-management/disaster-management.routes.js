import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { disasterManagementController } from "./disaster-management.controller.js";
import {
  assignedIncidentQuerySchema,
  incidentListQuerySchema,
  incidentParamsSchema,
  incidentResolutionBodySchema,
  incidentTransitionBodySchema,
  responderListQuerySchema,
  responderParamsSchema,
  responderStatusBodySchema,
} from "./disaster-management.validation.js";

export const createDisasterManagementRouter = ({ controller = disasterManagementController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN));

  router.get("/dashboard", asyncHandler(controller.dashboard));
  router.get("/jurisdiction-overview", asyncHandler(controller.jurisdictionOverview));
  router.get("/responders", validate({ query: responderListQuerySchema }), asyncHandler(controller.responders));
  router.get("/responders/me", asyncHandler(controller.me));
  router.patch("/responders/me/status", validate({ body: responderStatusBodySchema }), asyncHandler(controller.updateStatus));
  router.get("/responders/me/incidents", validate({ query: assignedIncidentQuerySchema }), asyncHandler(controller.myIncidents));
  router.get("/responders/:responderId", validate({ params: responderParamsSchema }), asyncHandler(controller.responder));

  router.get("/incidents", validate({ query: incidentListQuerySchema }), asyncHandler(controller.queue));
  router.get("/incidents/:incidentId", validate({ params: incidentParamsSchema }), asyncHandler(controller.get));
  router.post("/incidents/:incidentId/acknowledge", validate({ params: incidentParamsSchema, body: incidentTransitionBodySchema }), asyncHandler(controller.acknowledge));
  router.post("/incidents/:incidentId/start", validate({ params: incidentParamsSchema, body: incidentTransitionBodySchema }), asyncHandler(controller.start));
  router.post("/incidents/:incidentId/resolve", validate({ params: incidentParamsSchema, body: incidentResolutionBodySchema }), asyncHandler(controller.resolve));
  return router;
};

export const disasterManagementRouter = createDisasterManagementRouter();
export default disasterManagementRouter;
