import { z } from "zod";

const uuid = z.string().uuid();

export const incidentMessageParamsSchema = z.object({
  incidentId: uuid,
});

export const incidentMessageBodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export const incidentMessageListQuerySchema = z.object({
  before: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
