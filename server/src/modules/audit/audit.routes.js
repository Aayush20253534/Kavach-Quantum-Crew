import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { ROLES } from "../../constants/roles.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { auditController } from "./audit.controller.js";
import { auditListQuerySchema, auditSummaryQuerySchema } from "./audit.validation.js";

export const createAuditRouter = ({ controller = auditController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.SYSTEM_ADMIN));
  router.get("/", validate({ query: auditListQuerySchema }), asyncHandler(controller.list));
  router.get("/summary", validate({ query: auditSummaryQuerySchema }), asyncHandler(controller.summary));
  return router;
};

export const auditRouter = createAuditRouter();
export default auditRouter;
