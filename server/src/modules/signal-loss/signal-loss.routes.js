import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { signalLossController } from "./signal-loss.controller.js";
import {
  signalLossListQuerySchema,
  signalLossParamsSchema,
  signalLossResponseBodySchema,
  soloSignalLossParamsSchema,
  soloSignalLossResponseBodySchema,
} from "./signal-loss.validation.js";

export const createSignalLossRouter = () => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.TOURIST));
  router.get("/solo", validate({ query: signalLossListQuerySchema }), asyncHandler(signalLossController.listSolo));
  router.post("/solo/:alertId/respond", validate({ params: soloSignalLossParamsSchema, body: soloSignalLossResponseBodySchema }), asyncHandler(signalLossController.respondSolo));
  router.get("/", validate({ query: signalLossListQuerySchema }), asyncHandler(signalLossController.list));
  router.post("/:caseId/respond", validate({ params: signalLossParamsSchema, body: signalLossResponseBodySchema }), asyncHandler(signalLossController.respond));
  return router;
};
