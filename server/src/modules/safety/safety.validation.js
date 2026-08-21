import { z } from "zod";

const uuid = z.string().uuid();
const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

export const createZoneBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(["SAFE", "RISK"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("LOW"),
  latitude,
  longitude,
  radiusM: z.number().positive().max(50_000),
});

export const tripParamsSchema = z.object({ tripId: uuid });
export const zoneParamsSchema = z.object({ zoneId: uuid });
export const checkInParamsSchema = z.object({ checkInId: uuid });
export const alertParamsSchema = z.object({ alertId: uuid });

export const scheduleCheckInBodySchema = z.object({
  dueAt: z.coerce.date(),
});

export const alertListQuerySchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const zoneListQuerySchema = z.object({
  type: z.enum(["SAFE", "RISK"]).optional(),
  active: z.coerce.boolean().default(true),
});
