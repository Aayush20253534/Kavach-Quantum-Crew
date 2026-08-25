import { z } from "zod";
export const signalLossListQuerySchema = z.object({ tripId: z.string().uuid().optional() });
export const signalLossParamsSchema = z.object({ caseId: z.string().uuid() });
export const signalLossResponseBodySchema = z.object({ response: z.enum(["FALSE_ALARM", "CONFIRMED_DANGER"]) });
