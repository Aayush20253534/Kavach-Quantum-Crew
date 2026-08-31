import { getTopPlaces, getHotels } from "./tools.js";
import { generateItinerary } from "./itinerary.js";
import { selectHotels } from "./hotels.js";

/**
 * Mirrors build_trip_response(city, num_days, check_in, check_out) -> dict
 */
export async function buildTripResponse(city, numDays, checkIn, checkOut) {
  const rawPlaces = await getTopPlaces(city);
  const rawHotels = await getHotels(city, checkIn, checkOut);

  const itinerary = await generateItinerary(city, numDays, rawPlaces);
  const hotels = selectHotels(rawHotels, 6);

  return {
    itinerary,
    hotels: {
      city,
      hotels,
    },
  };
}