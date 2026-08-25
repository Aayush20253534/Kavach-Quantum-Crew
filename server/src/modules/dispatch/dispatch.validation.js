import { z } from "zod";
import { DISPATCH_STATUS_VALUES } from "../../constants/dispatchStatus.js";
import { EMERGENCY_UNIT_STATUS_VALUES } from "../../constants/emergencyUnitStatus.js";
import { EMERGENCY_UNIT_TYPE_VALUES } from "../../constants/emergencyUnitType.js";

const uuid = z.string().uuid();
export const dispatchParamsSchema = z.object({ dispatchId: uuid });
export const incidentDispatchParamsSchema = z.object({ incidentId: uuid });
export const autoDispatchParamsSchema = z.object({
  incidentId: uuid,
  serviceType: z.enum(["police", "fire", "ambulance"]),
});
export const unitParamsSchema = z.object({ unitId: uuid });
export const createUnitBodySchema = z.object({ name: z.string().trim().min(2).max(120), type: z.enum(EMERGENCY_UNIT_TYPE_VALUES), organization: z.string().trim().max(160).optional(), jurisdiction: z.string().trim().max(160).optional(), contactPhone: z.string().trim().max(20).optional() });
export const unitListQuerySchema = z.object({ type: z.enum(EMERGENCY_UNIT_TYPE_VALUES).optional(), status: z.enum(EMERGENCY_UNIT_STATUS_VALUES).optional(), limit: z.coerce.number().int().min(1).max(100).default(50) });
export const unitStatusBodySchema = z.object({ status: z.enum(EMERGENCY_UNIT_STATUS_VALUES) });
export const createDispatchBodySchema = z.object({ unitType: z.enum(EMERGENCY_UNIT_TYPE_VALUES), unitId: uuid.optional(), note: z.string().trim().max(1000).optional() });
export const assignDispatchBodySchema = z.object({ unitId: uuid, note: z.string().trim().max(1000).optional() });
export const dispatchTransitionBodySchema = z.object({ status: z.enum(DISPATCH_STATUS_VALUES), note: z.string().trim().max(1000).optional() });
export const autoDispatchBodySchema = z.object({ note: z.string().trim().max(1000).optional() }).default({});
