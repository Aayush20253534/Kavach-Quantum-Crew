import "dotenv/config";
import Groq from "groq-sdk";
import { ItineraryLLMOutputSchema } from "./schemas.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Mirrors generate_itinerary(city, num_days, places) -> ItineraryOutput
 */
export async function generateItinerary(city, numDays, places) {
  const placesLookup = {};
  for (const p of places.slice(0, 10)) {
    placesLookup[p.name] = p;
  }

  const placesForLlm = places.slice(0, 10).map((p) => ({
    name: p.name,
    rating: p.rating ?? null,
  }));

  const prompt = `
Create exactly ${numDays} days of travel itinerary.

Available places:

${JSON.stringify(placesForLlm)}

Return JSON using EXACTLY this structure:

{
    "days": [
        {
            "day": 1,
            "places": [
                {
                    "name": "exact place name from the provided list",
                    "start_time": "09:00",
                    "end_time": "10:30"
                }
            ]
        }
    ]
}

Rules:
- The top-level key MUST be "days".
- Do NOT use "itinerary".
- Each day MUST use the key "places".
- Do NOT use "visits".
- Each place MUST use "name".
- Use only places from the provided list.
- Do not invent places.
- Create exactly ${numDays} days.
- Include 2 to 4 places per day.
- Do not repeat places.
- Return only valid JSON.
`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const rawContent = completion.choices[0]?.message?.content ?? "{}";
  const parsedJson = JSON.parse(rawContent);
  const llmResult = ItineraryLLMOutputSchema.parse(parsedJson);

  // re-attach url/thumbnail from the original SerpAPI data, never from the LLM
  const enrichedDays = llmResult.days.map((day) => {
    const enrichedPlaces = day.places.map((place) => {
      const source = placesLookup[place.name];
      return {
        name: place.name,
        start_time: place.start_time,
        end_time: place.end_time,
        url: source ? (source.url ?? null) : null,
        thumbnail: source ? (source.thumbnail ?? null) : null,
      };
    });

    return {
      day: day.day,
      places: enrichedPlaces,
    };
  });

  return {
    city,
    days: enrichedDays,
  };
}