import { z } from "zod";
import { RISK_ZONE_GEOMETRY_VALUES } from "../../constants/riskZoneGeometry.js";

const uuid = z.string().uuid();
const coordinate = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

const base = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(["SAFE", "RISK"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("LOW"),
  geometryType: z.enum(RISK_ZONE_GEOMETRY_VALUES),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusM: z.coerce.number().positive().max(100_000).optional(),
  polygon: z.array(coordinate).min(3).max(200).optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
});

const geometryCheck = (value, ctx) => {
  if (
    value.geometryType === "CIRCLE" &&
    ((value.latitude === null || value.latitude === undefined) ||
      (value.longitude === null || value.longitude === undefined) ||
      (value.radiusM === null || value.radiusM === undefined))
  ) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Circle zones require latitude, longitude and radiusM" });
  }
  if (value.geometryType === "POLYGON" && (!value.polygon || value.polygon.length < 3)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Polygon zones require at least three vertices" });
  }
  if (value.validFrom && value.validUntil && value.validUntil <= value.validFrom) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "validUntil must be after validFrom" });
  }
};

export const createRiskZoneBodySchema = base.superRefine(geometryCheck);
export const updateRiskZoneBodySchema = base.partial().superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one field is required" });
  if (value.validFrom && value.validUntil && value.validUntil <= value.validFrom) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "validUntil must be after validFrom" });
  }
});
export const riskZoneParamsSchema = z.object({ zoneId: uuid });
export const riskZoneListQuerySchema = z.object({
  type: z.enum(["SAFE", "RISK"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  geometryType: z.enum(RISK_ZONE_GEOMETRY_VALUES).optional(),
  active: z.preprocess((v) => v === "true" ? true : v === "false" ? false : v, z.boolean()).optional(),
  effective: z.preprocess((v) => v === "true" ? true : v === "false" ? false : v, z.boolean()).default(true),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const evaluateRiskZoneBodySchema = coordinate;
