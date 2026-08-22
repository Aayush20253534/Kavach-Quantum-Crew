import { z } from "zod";
import { ROLES } from "../../constants/roles.js";

const optionalDate = z.coerce.date().optional();

export const auditListQuerySchema = z.object({
  actorId: z.string().uuid().optional(),
  actorRole: z.enum(Object.values(ROLES)).optional(),
  action: z.string().trim().min(1).max(100).optional(),
  entityType: z.string().trim().min(1).max(100).optional(),
  entityId: z.string().trim().min(1).max(100).optional(),
  from: optionalDate,
  to: optionalDate,
  limit: z.coerce.number().int().min(1).max(200).default(50),
}).superRefine((value, ctx) => {
  if (value.from && value.to && value.to < value.from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "to must be on or after from",
    });
  }
});

export const auditSummaryQuerySchema = z.object({
  from: optionalDate,
  to: optionalDate,
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).superRefine((value, ctx) => {
  if (value.from && value.to && value.to < value.from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "to must be on or after from",
    });
  }
});
