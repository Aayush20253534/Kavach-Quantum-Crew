# KAVACH Python AI Trip Planner

The trip planner is a standalone FastAPI service under `ai-ml/trip-planner/`. It produces itinerary and hotel suggestions. It is **not** the authority for trip ownership, group readiness, plan attachment, or trip start.

## Active runtime files

| File | Purpose |
|---|---|
| `main.py` | FastAPI application and HTTP contract |
| `trip_core.py` | active SerpAPI/Groq planning implementation |
| `requirements.txt` | Python runtime dependencies |
| `.env.example` | provider configuration |

The JavaScript files in this directory represent an older/alternate planner implementation. The current FastAPI app imports `build_trip_response` from `trip_core.py`; those JS files are not used by `main.py`.

## Endpoints

```text
GET  /
GET  /health
POST /api/trip/plan
```

The root endpoint is intentionally cheap for Render/browser checks.

## Request flow

```text
TripPlanRequest
  city
  num_days > 0
  optional dates
      |
      v
plan_trip()
      |
      v
build_trip_response()
      |
      +--> get_top_places(city)
      |       |
      |       `--> SerpAPI engine=google, query "Places to Visit in <city>"
      |            top_sights.sights -> first 15
      |
      +--> generate_itinerary(city, num_days, places)
      |       |
      |       +--> only first 10 places are presented to Groq
      |       +--> structured Pydantic JSON output
      |       +--> exact requested day count
      |       +--> 2-4 places/day
      |       +--> no repeats
      |       `--> URL/thumbnail are reattached from source lookup
      |            rather than trusted from the model
      |
      `--> get_hotels(city, dates)
              |
              `--> SerpAPI google_hotels
                    |
                    v
              select_hotels()
                    |
                    +--> normalize INR price strings
                    +--> split price range into up to 6 buckets
                    +--> choose best rating in each populated bucket
                    `--> sort selected hotels by price
```

## Why URL/thumbnail enrichment happens after Groq

The model is asked to choose names and times, not invent external metadata. A `places_lookup` built from SerpAPI is used to reattach `url` and `thumbnail`. This makes those fields traceable to the external search result rather than generated text.

## Hotel failure behavior

Hotel data is supplemental. `build_trip_response()` wraps only the hotel path in its own `try/except`.

If Google Hotels/SerpAPI fails:

```json
{
  "itinerary": { "...": "still returned" },
  "hotels": { "city": "...", "hotels": [] },
  "warnings": ["Hotel recommendations unavailable: ..."]
}
```

This avoids turning a usable itinerary into a backend `502/503` merely because hotel availability failed.

## Integrated KAVACH flow

```text
Tourist selects one allowed destination + dates
        |
        v
main backend /api/v1/trips/ai-plan
        |
        v
FastAPI /api/trip/plan
        |
        v
returned plan
        |
        v
main backend validates trip authorization/status
        |
        v
attach plan to PLANNED trip
        |
        v
auto-start trip
```

For GROUP trips, the main backend additionally requires a locked group with at least two active members and leader authorization. The FastAPI service does not enforce those application rules.

## Environment

```env
SERPAPI_API_KEY=...
GROQ_API_KEY=...
```

## Local run

```bash
cd ai-ml/trip-planner
python -m venv .venv
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 4300
```

## Main-backend configuration

```env
TRIP_PLANNER_SERVICE_URL=http://localhost:4300
AI_TRIP_PLAN_TIMEOUT_MS=120000
```

Use only the service root in `TRIP_PLANNER_SERVICE_URL`; the Node backend adds `/api/trip/plan`.

## Production checks

```text
GET https://<planner>/
GET https://<planner>/health
```

Then test one integrated plan through the main backend, because direct FastAPI success does not prove the authorization/save/start flow works.
