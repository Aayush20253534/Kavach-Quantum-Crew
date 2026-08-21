import { z } from "zod";

const uuid = z.string().uuid();
const coordinate = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const monitoringTripParamsSchema = z.object({ tripId: uuid });

export const monitoringPolicyBodySchema = z.object({
  enabled: z.boolean().optional(),
  trackingGapAfterMinutes: z.coerce.number().int().min(1).max(120).optional(),
  inactivityAfterMinutes: z.coerce.number().int().min(2).max(240).optional(),
  inactivityRadiusM: z.coerce.number().positive().max(5000).optional(),
  groupSeparationM: z.coerce.number().positive().max(50_000).optional(),
  routeDeviationM: z.coerce.number().positive().max(20_000).optional(),
  overtimeGraceMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  plannedRoute: z.array(coordinate).min(2).max(500).nullable().optional(),
}).superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one monitoring policy field is required" });
  }
});

export const monitoringSweepBodySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});
