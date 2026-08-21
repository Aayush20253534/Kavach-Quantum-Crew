import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { evidenceController } from "./evidence.controller.js";
import { uploadEvidenceFile } from "./evidence.upload.js";
import { evidenceListQuerySchema, evidenceParamsSchema, evidenceUploadBodySchema } from "./evidence.validation.js";

export const createEvidenceRouter = ({ controller = evidenceController } = {}) => {
  const router = Router();
  router.use(authenticate, authorize(ROLES.TOURIST, ROLES.DISASTER_MANAGER, ROLES.SYSTEM_ADMIN));
  router.post("/", uploadEvidenceFile, validate({ body: evidenceUploadBodySchema }), asyncHandler(controller.upload));
  router.get("/", validate({ query: evidenceListQuerySchema }), asyncHandler(controller.list));
  router.get("/:attachmentId", validate({ params: evidenceParamsSchema }), asyncHandler(controller.get));
  router.get("/:attachmentId/content", validate({ params: evidenceParamsSchema }), asyncHandler(controller.content));
  router.delete("/:attachmentId", validate({ params: evidenceParamsSchema }), asyncHandler(controller.remove));
  return router;
};

export default createEvidenceRouter;
