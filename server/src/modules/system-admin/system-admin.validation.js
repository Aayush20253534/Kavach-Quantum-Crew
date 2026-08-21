import { z } from "zod";

export const adminAccountParamsSchema = z.object({
  role: z.enum(["TOURIST", "DISASTER_MANAGER", "SYSTEM_ADMIN"]),
  accountId: z.string().uuid(),
});

export const adminAccountListQuerySchema = z.object({
  role: z.enum(["TOURIST", "DISASTER_MANAGER", "SYSTEM_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const adminAccountStatusBodySchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]),
  reason: z.string().trim().min(2).max(500).optional(),
});

export const adminResourceParamsSchema = z.object({
  resource: z.enum(["trips", "groups", "incidents", "hazards", "risk-zones", "emergency-units", "dispatches"]),
});

export const adminResourceListQuerySchema = z.object({
  status: z.string().trim().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
