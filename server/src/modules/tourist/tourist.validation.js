import { z } from "zod";

const gender = z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, "Phone number must contain 7 to 15 digits and may start with +");

export const onboardingBodySchema = z.object({
  gender,
  age: z.coerce.number().int().min(1).max(120),
  medicalHistory: z.string().trim().max(5000).optional().nullable(),
  emergencyPhone: phone,
  nationality: z.string().trim().min(2).max(80),
  preferredLanguage: z.string().trim().min(2).max(40),
  emergencyContactName: z.string().trim().min(2).max(120),
  emergencyContactRelation: z.string().trim().min(2).max(60),
  bloodGroup: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  governmentIdNumber: z.string().trim().min(4).max(120),
  liveTrackingEnabled: z.boolean(),
  geoAlertsEnabled: z.boolean(),
});

export const updateTouristProfileBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/).optional(),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
    phone: phone.optional(),
    profilePicUrl: z.string().trim().url().max(2048).optional().nullable(),
    gender: gender.optional(),
    age: z.coerce.number().int().min(1).max(120).optional(),
    medicalHistory: z.string().trim().max(5000).optional().nullable(),
    emergencyPhone: phone.optional(),
    nationality: z.string().trim().min(2).max(80).optional(),
    preferredLanguage: z.string().trim().min(2).max(40).optional(),
    emergencyContactName: z.string().trim().min(2).max(120).optional(),
    emergencyContactRelation: z.string().trim().min(2).max(60).optional(),
    bloodGroup: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]).optional(),
    governmentIdNumber: z.string().trim().min(4).max(120).optional(),
    liveTrackingEnabled: z.boolean().optional(),
    geoAlertsEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field must be provided",
  });
