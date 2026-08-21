import { z } from "zod";
export const alertParamsSchema=z.object({alertId:z.string().uuid()});
export const alertQuerySchema=z.object({status:z.enum(["OPEN","ACKNOWLEDGED","RESOLVED"]).optional(),limit:z.coerce.number().int().min(1).max(100).default(50)});
