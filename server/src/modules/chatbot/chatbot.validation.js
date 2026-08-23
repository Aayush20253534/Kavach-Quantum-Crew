import { z } from "zod";

const coordinates = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const chatbotMessageBodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
  location: coordinates.nullable().optional(),
  context: z.record(z.string(), z.unknown()).default({}),
});
