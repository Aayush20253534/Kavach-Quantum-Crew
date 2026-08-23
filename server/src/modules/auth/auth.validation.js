import { z } from "zod";

const username = z
  .string()
  .trim()
  .min(6)
  .max(40)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username may contain letters, numbers, dot, underscore and hyphen only")
  .transform((value) => value.toLowerCase());

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const phone = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Phone number must contain exactly 10 digits");

const password = z
  .string()
  .min(8)
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a number");

export const registerBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    username,
    email,
    phone,
    password,
    confirmPassword: z.string(),
  })
  .superRefine((data, context) => {
    if (data.password !== data.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const loginBodySchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(128),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().trim().min(20).optional(),
});

export const logoutBodySchema = refreshBodySchema;

export const verifyEmailBodySchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export const resendEmailVerificationBodySchema = z.object({ email });


export const usernameAvailabilityQuerySchema = z.object({
  username,
});
