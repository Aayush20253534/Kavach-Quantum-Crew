import { z } from "zod";

const tripId = z.string().uuid();
const dateTime = z.string().datetime({ offset: true });

export const createTripBodySchema = z
  .object({
    locationName: z.string().trim().min(2).max(160),
    tripType: z.enum(["SOLO", "GROUP"]),
    plannedStartAt: dateTime,
    plannedEndAt: dateTime,
  })
  .superRefine((value, context) => {
    const start = new Date(value.plannedStartAt);
    const end = new Date(value.plannedEndAt);
    if (end <= start) {
      context.addIssue({
        code: "custom",
        path: ["plannedEndAt"],
        message: "plannedEndAt must be after plannedStartAt",
      });
    }
  });

export const tripIdParamsSchema = z.object({ tripId });

export const consentIdParamsSchema = z.object({
  tripId,
  consentId: z.string().uuid(),
});

export const grantConsentBodySchema = z.object({
  type: z.enum(["LOCATION_TRACKING", "EMERGENCY_SHARING"]),
});

export const tripHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export const extendTripBodySchema = z.object({
  plannedEndAt: dateTime,
});
