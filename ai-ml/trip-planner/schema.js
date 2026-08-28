import { z } from "zod";

// --- mirrors Place(BaseModel) ---
export const PlaceSchema = z.object({
  name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  url: z.string().nullable().optional().default(null),
  thumbnail: z.string().nullable().optional().default(null),
});

// --- mirrors DayPlan(BaseModel) ---
export const DayPlanSchema = z.object({
  day: z.number().int(),
  places: z.array(PlaceSchema),
});

// --- mirrors ItineraryLLMOutput(BaseModel) ---
// (LLM only returns name/start_time/end_time per place)
export const ItineraryLLMPlaceSchema = z.object({
  name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
});

export const ItineraryLLMDaySchema = z.object({
  day: z.number().int(),
  places: z.array(ItineraryLLMPlaceSchema),
});

export const ItineraryLLMOutputSchema = z.object({
  days: z.array(ItineraryLLMDaySchema),
});

// --- mirrors ItineraryOutput(BaseModel) ---
export const ItineraryOutputSchema = z.object({
  city: z.string(),
  days: z.array(DayPlanSchema),
});

// --- mirrors Hotel(BaseModel) ---
export const HotelSchema = z.object({
  name: z.string(),
  price: z.number(),
  rating: z.number().nullable().optional().default(null),
  hotel_class: z.string().nullable().optional().default(null),
  thumbnail: z.string().nullable().optional().default(null),
});

// --- mirrors HotelOutput(BaseModel) ---
export const HotelOutputSchema = z.object({
  city: z.string(),
  hotels: z.array(HotelSchema),
});