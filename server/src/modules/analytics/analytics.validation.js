import { z } from "zod";

export const analyticsRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).superRefine((value, ctx) => {
  if (value.from && value.to && value.to < value.from) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "to must be on or after from" });
  }
});
