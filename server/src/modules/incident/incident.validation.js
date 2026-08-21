import { z } from "zod";
const uuid = z.string().uuid();
export const incidentParamsSchema = z.object({ incidentId: uuid });
export const incidentListQuerySchema = z.object({ status: z.enum(["OPEN","ACKNOWLEDGED","IN_PROGRESS","RESOLVED","DISMISSED"]).optional(), severity: z.enum(["WARNING","DANGER","CRITICAL"]).optional(), limit: z.coerce.number().int().min(1).max(100).default(50) });
export const incidentTransitionBodySchema = z.object({ note: z.string().trim().min(2).max(1000).optional() });
export const incidentResolutionBodySchema = z.object({ note: z.string().trim().min(2).max(1000) });
