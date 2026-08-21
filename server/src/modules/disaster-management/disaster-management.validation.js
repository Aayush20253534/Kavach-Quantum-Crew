import { z } from "zod";

const uuid = z.string().uuid();
const incidentStatus = z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"]);
const severity = z.enum(["WARNING", "DANGER", "CRITICAL"]);
const responderStatus = z.enum(["AVAILABLE", "BUSY", "OFF_DUTY"]);

export const incidentParamsSchema = z.object({ incidentId: uuid });
export const responderParamsSchema = z.object({ responderId: uuid });

export const incidentListQuerySchema = z.object({
  status: incidentStatus.optional(),
  severity: severity.optional(),
  scope: z.enum(["ALL", "UNASSIGNED", "MINE"]).default("ALL"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const assignedIncidentQuerySchema = z.object({
  status: incidentStatus.optional(),
  severity: severity.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const responderListQuerySchema = z.object({
  status: responderStatus.optional(),
  organization: z.string().trim().min(2).max(160).optional(),
  jurisdiction: z.string().trim().min(2).max(160).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const responderStatusBodySchema = z.object({ status: responderStatus });
export const incidentTransitionBodySchema = z.object({ note: z.string().trim().min(2).max(1000).optional() });
export const incidentResolutionBodySchema = z.object({ note: z.string().trim().min(2).max(1000) });
