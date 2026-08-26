import { z } from "zod";

export const adminAccountParamsSchema = z.object({
  role: z.enum(["TOURIST", "DISASTER_MANAGER", "SYSTEM_ADMIN", "POLICE", "FIRE", "AMBULANCE"]),
  accountId: z.string().uuid(),
});

export const adminAccountListQuerySchema = z.object({
  role: z.enum(["TOURIST", "DISASTER_MANAGER", "SYSTEM_ADMIN", "POLICE", "FIRE", "AMBULANCE"]).optional(),
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


export const adminDestinationListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.preprocess(
    (value) => (value === "true" ? true : value === "false" ? false : value),
    z.boolean(),
  ).optional(),
  featured: z.preprocess(
    (value) => (value === "true" ? true : value === "false" ? false : value),
    z.boolean(),
  ).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

export const adminDestinationParamsSchema = z.object({
  destinationId: z.string().uuid(),
});

const destinationBody = z.object({
  name: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80).default("India"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  description: z.string().trim().max(500).optional().nullable(),
  featured: z.boolean().default(true),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(-10000).max(10000).default(0),
});

export const adminDestinationCreateBodySchema = destinationBody;

export const adminDestinationUpdateBodySchema = destinationBody
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one destination field is required",
  });
