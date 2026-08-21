import { z } from "zod";

const uuid = z.string().uuid();

const coordinates = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const aiRiskAssessmentBodySchema = z.object({
  tripId: uuid,
  location: coordinates,
  context: z.record(z.string(), z.unknown()).default({}),
});

export const aiHazardAnalysisBodySchema = z.object({
  hazardId: uuid.optional(),
  type: z.string().trim().min(2).max(80),
  description: z.string().trim().min(1).max(2000),
  location: coordinates,
  context: z.record(z.string(), z.unknown()).default({}),
});

const proofBase = z.object({
  referenceId: z.string().trim().min(1).max(200),
  payloadHash: z.string().trim().regex(/^[a-fA-F0-9]{64}$/),
  timestamp: z.coerce.date(),
});

export const blockchainSafetyIdProofBodySchema = proofBase.extend({
  safetyId: z.string().trim().min(1).max(200),
});

export const blockchainIncidentProofBodySchema = proofBase.extend({
  incidentId: uuid,
});

export const blockchainEvidenceProofBodySchema = proofBase.extend({
  attachmentId: uuid,
});

export const blockchainVerificationParamsSchema = z.object({
  reference: z.string().trim().min(1).max(200),
});
