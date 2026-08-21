import { z } from "zod";

import { HAZARD_SEVERITY_VALUES } from "../../constants/hazardSeverity.js";
import { HAZARD_STATUS_VALUES } from "../../constants/hazardStatus.js";
import { HAZARD_TYPE_VALUES } from "../../constants/hazardTypes.js";

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const hazardParamsSchema = z.object({ hazardId: z.string().uuid() });

export const createHazardBodySchema = z.object({
  type: z.enum(HAZARD_TYPE_VALUES),
  severity: z.enum(HAZARD_SEVERITY_VALUES).default("MEDIUM"),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(1000),
  latitude,
  longitude,
  locationName: z.string().trim().max(200).optional(),
  occurredAt: z.coerce.date().optional(),
});

export const hazardListQuerySchema = z.object({
  status: z.enum(HAZARD_STATUS_VALUES).optional(),
  type: z.enum(HAZARD_TYPE_VALUES).optional(),
  severity: z.enum(HAZARD_SEVERITY_VALUES).optional(),
  mine: z.preprocess((value) => value === "true" ? true : value === "false" ? false : value, z.boolean()).default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const nearbyHazardQuerySchema = z.object({
  latitude,
  longitude,
  radiusKm: z.coerce.number().positive().max(100).default(10),
  type: z.enum(HAZARD_TYPE_VALUES).optional(),
  severity: z.enum(HAZARD_SEVERITY_VALUES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const hazardModerationBodySchema = z.object({
  note: z.string().trim().min(2).max(1000).optional(),
});
