import { z } from "zod";

const username = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .regex(/^[a-zA-Z0-9._-]+$/, "Username may contain letters, numbers, dot, underscore and hyphen only")
  .transform((value) => value.toLowerCase());

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const phone = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, "Phone number must contain 7 to 15 digits and may start with +");

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
