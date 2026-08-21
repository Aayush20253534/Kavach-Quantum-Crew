import { z } from "zod";

export const evidenceParamsSchema = z.object({ attachmentId: z.string().uuid() });

const targetShape = {
  incidentId: z.string().uuid().optional(),
  hazardId: z.string().uuid().optional(),
};

const exactlyOneTarget = (value, context) => {
  if (Boolean(value.incidentId) === Boolean(value.hazardId)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Exactly one of incidentId or hazardId is required",
    });
  }
};

export const evidenceUploadBodySchema = z.object(targetShape).superRefine(exactlyOneTarget);

export const evidenceListQuerySchema = z.object({
  ...targetShape,
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).superRefine(exactlyOneTarget);
