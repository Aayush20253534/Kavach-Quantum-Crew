import { z } from "zod";

const uuid = z.string().uuid();
export const tripIdParamsSchema = z.object({ tripId: uuid });
export const groupIdParamsSchema = z.object({ groupId: uuid });
export const memberParamsSchema = z.object({ groupId: uuid, memberId: uuid });
export const invitationParamsSchema = z.object({ groupId: uuid, invitationId: uuid });
export const createInvitationBodySchema = z.object({
  expiresInMinutes: z.coerce.number().int().min(5).max(1440).default(30),
});
export const joinGroupBodySchema = z.object({
  inviteToken: z.string().min(32).max(256),
});

export const previewJoinGroupBodySchema = joinGroupBodySchema;
