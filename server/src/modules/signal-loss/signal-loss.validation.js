import { z } from "zod";
export const signalLossListQuerySchema = z.object({ tripId: z.string().uuid().optional() });
export const signalLossParamsSchema = z.object({ caseId: z.string().uuid() });
export const signalLossResponseBodySchema = z.object({ response: z.enum(["FALSE_ALARM", "CONFIRMED_DANGER"]) });
export const soloSignalLossParamsSchema = z.object({ alertId: z.string().uuid() });
export const soloSignalLossResponseBodySchema = z.object({ response: z.enum(["I_AM_SAFE", "NEED_HELP"]) });
