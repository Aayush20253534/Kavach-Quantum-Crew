import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { dispatchController } from "./dispatch.controller.js";
import { assignDispatchBodySchema, createDispatchBodySchema, createUnitBodySchema, dispatchParamsSchema, dispatchTransitionBodySchema, incidentDispatchParamsSchema, unitListQuerySchema, unitParamsSchema, unitStatusBodySchema } from "./dispatch.validation.js";

export const createDispatchRouter = ({ controller = dispatchController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN));
  router.get("/units", validate({ query: unitListQuerySchema }), asyncHandler(controller.listUnits));
  router.post("/units", authorize(ROLES.SYSTEM_ADMIN), validate({ body: createUnitBodySchema }), asyncHandler(controller.createUnit));
  router.patch("/units/:unitId/status", authorize(ROLES.SYSTEM_ADMIN), validate({ params: unitParamsSchema, body: unitStatusBodySchema }), asyncHandler(controller.setUnitStatus));
  router.post("/incidents/:incidentId", validate({ params: incidentDispatchParamsSchema, body: createDispatchBodySchema }), asyncHandler(controller.create));
  router.get("/incidents/:incidentId", validate({ params: incidentDispatchParamsSchema }), asyncHandler(controller.listForIncident));
  router.get("/:dispatchId", validate({ params: dispatchParamsSchema }), asyncHandler(controller.get));
  router.post("/:dispatchId/assign", validate({ params: dispatchParamsSchema, body: assignDispatchBodySchema }), asyncHandler(controller.assign));
  router.patch("/:dispatchId/status", validate({ params: dispatchParamsSchema, body: dispatchTransitionBodySchema }), asyncHandler(controller.transition));
  return router;
};
export const dispatchRouter = createDispatchRouter();
export default dispatchRouter;
