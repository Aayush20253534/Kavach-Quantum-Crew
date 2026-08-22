import { z } from "zod";

const uuid = z.string().uuid();

export const trackingTripParamsSchema = z.object({ tripId: uuid });
export const groupLocationParamsSchema = z.object({ groupId: uuid });
export const latestLocationQuerySchema = z.object({ tripId: uuid });

export const locationPingBodySchema = z.object({
  tripId: uuid,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyM: z.number().positive().max(5000),
  timestamp: z.string().datetime({ offset: true }),
  altitudeM: z.number().min(-500).max(10000).optional(),
  headingDeg: z.number().min(0).max(360).optional(),
  speedMps: z.number().min(0).max(250).optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  networkStatus: z.enum(["WIFI", "CELLULAR", "OFFLINE", "UNKNOWN"]).optional(),
});
