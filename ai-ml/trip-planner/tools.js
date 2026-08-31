import "dotenv/config";
import axios from "axios";

const SERPAPI_BASE_URL = "https://serpapi.com/search.json";

/**
 * Thin wrapper mirroring `client.search({...})` from the Python `serpapi` client.
 */
async function serpApiSearch(params) {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "SERPAPI_API_KEY is not set. Add it to your .env file."
    );
  }

  const response = await axios.get(SERPAPI_BASE_URL, {
    params: {
      ...params,
      api_key: apiKey,
    },
  });
  return response.data;
}

/**
 * Get top-rated places to visit in a city.
 * Mirrors the @tool get_top_places(city: str) -> list[dict]
 */
export async function getTopPlaces(city) {
  const results = await serpApiSearch({
    engine: "google",
    location: city,
    google_domain: "google.com",
    hl: "en",
    gl: "in",
    q: `Places to Visit in ${city}`,
  });

  const sights = results?.top_sights?.sights ?? [];

  return sights.slice(0, 15).map((r) => ({
    name: r.title,
    rating: r.rating ?? null,
    thumbnail: r.thumbnail ?? null,
    url: r.link ?? null,
  }));
}

/**
 * Get hotels in a city with pricing.
 * Dates default to 7 days from now for check-in and 10 days from now for check-out.
 * Mirrors the @tool get_hotels(city, check_in=None, check_out=None) -> list[dict]
 */
export async function getHotels(city, checkIn = null, checkOut = null) {
  if (!checkIn) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    checkIn = d.toISOString().split("T")[0];
  }

  if (!checkOut) {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    checkOut = d.toISOString().split("T")[0];
  }

  const results = await serpApiSearch({
    engine: "google_hotels",
    check_in_date: checkIn,
    check_out_date: checkOut,
    q: `hotels in ${city}`,
    currency: "INR",
    gl: "in",
    hl: "en",
  });

  if (results?.search_metadata?.status === "Error") {
    throw new Error(`SerpAPI error: ${results?.error}`);
  }

  const properties = results?.properties ?? [];

  return properties
    .filter((h) => h?.rate_per_night?.lowest != null)
    .map((h) => ({
      name: h.name,
      price: h.rate_per_night?.lowest ?? null,
      rating: h.overall_rating ?? null,
      hotel_class: h.hotel_class ?? null,
      thumbnail: (h.images?.[0])?.thumbnail ?? null,
    }));
}