import { environment } from "../../config/environment.js";

const PLACE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
].join(",");

const CATEGORY_QUERIES = Object.freeze({
  policeStations: "police station",
  fireStations: "fire station",
  hospitals: "hospital",
});

const normalizePlace = (place) => ({
  id: place.id,
  name: place.displayName?.text || "Unnamed location",
  address: place.formattedAddress || "",
  latitude: place.location?.latitude ?? null,
  longitude: place.location?.longitude ?? null,
});

const searchText = async ({ query, jurisdiction, apiKey, fetchImpl }) => {
  const response = await fetchImpl(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": PLACE_FIELDS,
      },
      body: JSON.stringify({
        textQuery: `${query} in ${jurisdiction}`,
        pageSize: 20,
        languageCode: "en",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`Google Places request failed with ${response.status}`);
    error.code = "GOOGLE_PLACES_REQUEST_FAILED";
    error.details = body.slice(0, 500);
    throw error;
  }

  const payload = await response.json();
  return (payload.places || []).map(normalizePlace);
};

export const createJurisdictionPlacesService = ({
  apiKey = environment.GOOGLE_MAPS_API_KEY,
  fetchImpl = globalThis.fetch,
} = {}) => ({
  async lookup(jurisdiction) {
    if (!jurisdiction) {
      return {
        configured: Boolean(apiKey),
        jurisdiction: null,
        policeStations: [],
        fireStations: [],
        hospitals: [],
      };
    }

    if (!apiKey || typeof fetchImpl !== "function") {
      return {
        configured: false,
        jurisdiction,
        policeStations: [],
        fireStations: [],
        hospitals: [],
      };
    }

    const entries = await Promise.all(
      Object.entries(CATEGORY_QUERIES).map(async ([key, query]) => {
        try {
          return [key, await searchText({ query, jurisdiction, apiKey, fetchImpl })];
        } catch {
          // One Places category failing must not take down the command dashboard.
          return [key, []];
        }
      }),
    );

    return {
      configured: true,
      jurisdiction,
      ...Object.fromEntries(entries),
    };
  },
});

export const jurisdictionPlacesService = createJurisdictionPlacesService();
export default jurisdictionPlacesService;
