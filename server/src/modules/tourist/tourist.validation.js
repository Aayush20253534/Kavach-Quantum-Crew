import { z } from "zod";

const gender = z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]);
const phone = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Phone number must contain exactly 10 digits");

export const onboardingBodySchema = z
  .object({
    gender,
    age: z.coerce.number().int().min(0).max(100),
    medicalHistory: z.string().trim().max(5000).optional().nullable(),
    emergencyPhone: phone,
    nationality: z.string().trim().min(2).max(80),
    preferredLanguage: z.string().trim().min(2).max(40),
    emergencyContactName: z.string().trim().min(2).max(120),
    emergencyContactRelation: z.string().trim().min(2).max(60),
    bloodGroup: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
    governmentIdType: z.enum(["AADHAAR", "PASSPORT"]),
    governmentIdNumber: z.string().trim().min(4).max(120),
    liveTrackingEnabled: z.boolean(),
    geoAlertsEnabled: z.boolean(),
  })
  .superRefine((value, context) => {
    if (
      value.governmentIdType === "AADHAAR" &&
      !/^\d{12}$/.test(value.governmentIdNumber)
    ) {
      context.addIssue({
        code: "custom",
        path: ["governmentIdNumber"],
        message: "Aadhaar number must contain exactly 12 digits",
      });
    }

    if (
      value.governmentIdType === "PASSPORT" &&
      !/^[A-Za-z0-9]{6,20}$/.test(value.governmentIdNumber)
    ) {
      context.addIssue({
        code: "custom",
        path: ["governmentIdNumber"],
        message: "Passport ID must contain 6 to 20 letters or digits",
      });
    }
  });

export const updateTouristProfileBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/).optional(),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
    phone: phone.optional(),
    profilePicUrl: z.string().trim().url().max(2048).optional().nullable(),
    gender: gender.optional(),
    age: z.coerce.number().int().min(0).max(100).optional(),
    medicalHistory: z.string().trim().max(5000).optional().nullable(),
    emergencyPhone: phone.optional(),
    nationality: z.string().trim().min(2).max(80).optional(),
    preferredLanguage: z.string().trim().min(2).max(40).optional(),
    emergencyContactName: z.string().trim().min(2).max(120).optional(),
    emergencyContactRelation: z.string().trim().min(2).max(60).optional(),
    bloodGroup: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]).optional(),
    governmentIdType: z.enum(["AADHAAR", "PASSPORT"]).optional(),
    governmentIdNumber: z.string().trim().min(4).max(120).optional(),
    liveTrackingEnabled: z.boolean().optional(),
    geoAlertsEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field must be provided",
  });
