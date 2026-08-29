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

export const startTripBodySchema = z
  .object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    accuracyM: z.number().nonnegative().max(5000).optional(),
    capturedAt: dateTime.optional(),
  })
  .superRefine((value, context) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      context.addIssue({
        code: "custom",
        path: hasLatitude ? ["longitude"] : ["latitude"],
        message: "latitude and longitude must be provided together",
      });
    }
  })
  .default({});

export const aiTripPlanBodySchema = z
  .object({
    city: z.string().trim().min(2).max(160),
    num_days: z.number().int().min(1).max(30),
    check_in: z.string().date(),
    check_out: z.string().date(),
  })
  .superRefine((value, context) => {
    if (new Date(value.check_out) <= new Date(value.check_in)) {
      context.addIssue({
        code: "custom",
        path: ["check_out"],
        message: "check_out must be after check_in",
      });
    }
  });
