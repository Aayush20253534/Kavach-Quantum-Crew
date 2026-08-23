import { z } from "zod";

export const destinationQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  featured: z.preprocess(
    (value) => (value === "true" ? true : value === "false" ? false : value),
    z.boolean(),
  ).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
