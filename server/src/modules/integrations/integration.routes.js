import { Router } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler.js";

import { authenticate } from "../../middleware/authenticate.middleware.js";

import { validate } from "../../middleware/validate.middleware.js";

import { integrationController } from "./integration.controller.js";

import {
  aiHazardAnalysisBodySchema,
  aiRiskAssessmentBodySchema,
  blockchainEvidenceProofBodySchema,
  blockchainIncidentProofBodySchema,
  blockchainSafetyIdProofBodySchema,
  blockchainVerificationParamsSchema,
} from "./integration.validation.js";

export const createIntegrationRouter = () => {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/capabilities",
    asyncHandler(integrationController.capabilities),
  );

  router.post(
    "/ai/risk-assessment",
    validate({ body: aiRiskAssessmentBodySchema }),
    asyncHandler(integrationController.aiRiskAssessment),
  );

  router.post(
    "/ai/hazard-analysis",
    validate({ body: aiHazardAnalysisBodySchema }),
    asyncHandler(integrationController.aiHazardAnalysis),
  );

  router.post(
    "/blockchain/safety-id-proof",
    validate({ body: blockchainSafetyIdProofBodySchema }),
    asyncHandler(integrationController.blockchainSafetyIdProof),
  );

  router.post(
    "/blockchain/incident-proof",
    validate({ body: blockchainIncidentProofBodySchema }),
    asyncHandler(integrationController.blockchainIncidentProof),
  );

  router.post(
    "/blockchain/evidence-proof",
    validate({ body: blockchainEvidenceProofBodySchema }),
    asyncHandler(integrationController.blockchainEvidenceProof),
  );

  router.get(
    "/blockchain/verification/:reference",
    validate({ params: blockchainVerificationParamsSchema }),
    asyncHandler(integrationController.blockchainVerify),
  );

  return router;
};

const integrationRouter = createIntegrationRouter();

export default integrationRouter;