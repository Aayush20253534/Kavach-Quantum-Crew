import serpapi
import os
from dotenv import load_dotenv
load_dotenv()
client = serpapi.Client(api_key=os.getenv("SERPAPI_API_KEY"))

from langchain_core.tools import tool

@tool
def get_top_places(city: str) -> list[dict]:
    """Get top-rated places to visit in a city."""
    results = client.search({
        "engine": "google",
        "location": city,
        "google_domain": "google.com",
        "hl": "en",
        "gl": "in",
        "q": f"Places to Visit in {city}"
    })
    return [
        {
            "name": r["title"],
            "rating": r.get("rating"),
            "thumbnail": r.get("thumbnail"),
            "url": r.get("link"),
        }
        for r in results.get("top_sights", {}).get("sights", [])[:15]
    ]
    

from datetime import date, timedelta

from datetime import date, timedelta

@tool
def get_hotels(
    city: str,
    check_in: str = None,
    check_out: str = None
) -> list[dict]:
    """Get hotels in a city with pricing.

    Dates default to 7 days from now for check-in
    and 10 days from now for check-out.
    """

    if not check_in:
        check_in = (date.today() + timedelta(days=7)).isoformat()

    if not check_out:
        check_out = (date.today() + timedelta(days=10)).isoformat()

    results = client.search({
        "engine": "google_hotels",
        "check_in_date": check_in,
        "check_out_date": check_out,
        "q": f"hotels in {city}",
        "currency": "INR",
        "gl": "in",
        "hl": "en",
    })

    if results.get("search_metadata", {}).get("status") == "Error":
        raise ValueError(
            f"SerpAPI error: {results.get('error')}"
        )

    return [
        {
            "name": h["name"],
            "price": h.get("rate_per_night", {}).get("lowest"),
            "rating": h.get("overall_rating"),
            "hotel_class": h.get("hotel_class"),
            "thumbnail": (h.get("images") or [{}])[0].get("thumbnail"),
        }
        for h in results.get("properties", [])
        if h.get("rate_per_night", {}).get("lowest") is not None
    ]

from pydantic import BaseModel
from typing import Optional

from pydantic import BaseModel

from pydantic import BaseModel


class Place(BaseModel):
    name: str
    start_time: str
    end_time: str
    url: Optional[str] = None
    thumbnail: Optional[str] = None


class DayPlan(BaseModel):
    day: int
    places: list[Place]


class ItineraryLLMOutput(BaseModel):
    days: list[DayPlan]


class ItineraryOutput(BaseModel):
    city: str
    days: list[DayPlan]

class Hotel(BaseModel):
    name: str
    price: float
    rating: Optional[float]
    hotel_class: Optional[str]
    thumbnail: Optional[str]

class HotelOutput(BaseModel):
    city: str
    hotels: list[Hotel]

from langchain_groq import ChatGroq
from dotenv import load_dotenv
load_dotenv()
llm = ChatGroq(
    model = "openai/gpt-oss-20b",
    api_key= os.getenv("GROQ_API_KEY"),
    max_tokens=4096
)

def generate_itinerary(
    city: str,
    num_days: int,
    places: list[dict]
) -> ItineraryOutput:

    places_lookup = {p["name"]: p for p in places[:10]}

    places_for_llm = [
        {
            "name": p["name"],
            "rating": p.get("rating")
        }
        for p in places[:10]
    ]

    llm_structured = llm.with_structured_output(
        ItineraryLLMOutput,
        method="json_mode"
    )

    prompt = f"""
Create exactly {num_days} days of travel itinerary.

Available places:

{places_for_llm}

Return JSON using EXACTLY this structure:

{{
    "days": [
        {{
            "day": 1,
            "places": [
                {{
                    "name": "exact place name from the provided list",
                    "start_time": "09:00",
                    "end_time": "10:30"
                }}
            ]
        }}
    ]
}}

Rules:
- The top-level key MUST be "days".
- Do NOT use "itinerary".
- Each day MUST use the key "places".
- Do NOT use "visits".
- Each place MUST use "name".
- Use only places from the provided list.
- Do not invent places.
- Create exactly {num_days} days.
- Include 2 to 4 places per day.
- Do not repeat places.
- Return only valid JSON.
"""

    result = llm_structured.invoke(prompt)

    # re-attach url/thumbnail from the original SerpAPI data, never from the LLM
    enriched_days = []
    for day in result.days:
        enriched_places = []
        for place in day.places:
            source = places_lookup.get(place.name)
            enriched_places.append(
                Place(
                    name=place.name,
                    start_time=place.start_time,
                    end_time=place.end_time,
                    url=source.get("url") if source else None,
                    thumbnail=source.get("thumbnail") if source else None,
                )
            )
        enriched_days.append(DayPlan(day=day.day, places=enriched_places))

    return ItineraryOutput(
        city=city,
        days=enriched_days
    )

def select_hotels(
    hotels: list[dict],
    num_buckets: int = 6
) -> list[Hotel]:

    priced = []

    for h in hotels:
        if h.get("price") is None:
            continue

        price = h["price"]

        # Convert string prices to float
        if isinstance(price, str):
            price = float(
                price.replace("₹", "")
                .replace(",", "")
                .strip()
            )

        hotel = {**h, "price": price}
        priced.append(hotel)

    if not priced:
        return []

    prices = [h["price"] for h in priced]

    min_price = min(prices)
    max_price = max(prices)

    if min_price == max_price:
        best = max(
            priced,
            key=lambda h: h.get("rating") or 0
        )
        return [Hotel(**best)]

    bucket_width = (
        max_price - min_price
    ) / num_buckets

    buckets = {}

    for h in priced:
        bucket_idx = min(
            int(
                (h["price"] - min_price)
                / bucket_width
            ),
            num_buckets - 1
        )

        current_best = buckets.get(bucket_idx)

        h_rating = h.get("rating") or 0

        if (
            current_best is None
            or h_rating > (current_best.get("rating") or 0)
        ):
            buckets[bucket_idx] = h

    selected = sorted(
        buckets.values(),
        key=lambda h: h["price"]
    )

    return [Hotel(**h) for h in selected]

def build_trip_response(city: str, num_days: int, check_in: str, check_out: str) -> dict:
    raw_places = get_top_places.invoke({"city": city})
    raw_hotels = get_hotels.invoke({"city": city, "check_in": check_in, "check_out": check_out})

    itinerary = generate_itinerary(city, num_days, raw_places)
    hotels = select_hotels(raw_hotels, num_buckets=6)

    return {
        "itinerary": itinerary.model_dump(),
        "hotels": HotelOutput(city=city, hotels=hotels).model_dump(),
    }