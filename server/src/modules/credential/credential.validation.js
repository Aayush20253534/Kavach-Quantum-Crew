import { z } from "zod";
export const tripCredentialParamsSchema = z.object({ tripId: z.string().uuid() });
export const groupCredentialParamsSchema = z.object({ groupId: z.string().uuid() });
export const verifyCredentialParamsSchema = z.object({ token: z.string().min(20).max(4096) });
