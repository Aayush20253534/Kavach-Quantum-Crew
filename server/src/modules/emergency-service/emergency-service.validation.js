import { z } from "zod";
import { ROLES } from "../../constants/roles.js";
import { DISPATCH_STATUS_VALUES } from "../../constants/dispatchStatus.js";

const serviceTypes = [ROLES.POLICE, ROLES.FIRE, ROLES.AMBULANCE];
const uuid = z.string().uuid();
const location = {
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
};

export const registerEmergencyServiceBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(6).max(40).regex(/^[a-zA-Z0-9._-]+$/).transform((v) => v.toLowerCase()),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  phone: z.string().trim().regex(/^\d{10}$/),
  password: z.string().min(8).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
  confirmPassword: z.string(),
  serviceType: z.enum(serviceTypes),
  organization: z.string().trim().max(160).optional(),
  address: z.string().trim().max(240).optional(),
  jurisdiction: z.string().trim().max(160).optional(),
  ...location,
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
});

export const emergencyLocationBodySchema = z.object({ ...location });
export const emergencyDispatchParamsSchema = z.object({ dispatchId: uuid });
export const emergencyDispatchStatusBodySchema = z.object({
  status: z.enum(DISPATCH_STATUS_VALUES),
  note: z.string().trim().max(1000).optional(),
});
