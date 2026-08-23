import { z } from "zod";

export const touristDashboardQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
}).superRefine((value, context) => {
  if ((value.latitude === undefined) !== (value.longitude === undefined)) {
    context.addIssue({ code: "custom", path: ["latitude"], message: "latitude and longitude must be provided together" });
  }
});
