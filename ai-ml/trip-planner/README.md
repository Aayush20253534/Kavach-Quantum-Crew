# KAVACH AI Trip Planner

Standalone FastAPI microservice used by the main KAVACH backend for itinerary generation. The browser never calls this service directly.

## Architecture

```text
React client
   → main Express backend POST /api/v1/trips/ai-plan
      → FastAPI POST /api/trip/plan
         → SerpAPI places + hotels
         → Groq itinerary generation
```

## Environment

```env
SERPAPI_API_KEY=...
GROQ_API_KEY=...
```

## Local run

```bash
python -m venv .venv
# activate the environment
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 4300 --reload
```

Endpoints:

- `GET /health`
- `POST /api/trip/plan`

Example request:

```json
{
  "city": "Prayagraj",
  "num_days": 2,
  "check_in": "2026-08-29",
  "check_out": "2026-08-31"
}
```

The response contains `itinerary` and `hotels`. Hotel lookup failures are non-fatal: the service may return an empty hotel list plus `warnings` while preserving the itinerary.

## Main backend configuration

Local:

```env
TRIP_PLANNER_SERVICE_URL=http://127.0.0.1:4300
AI_TRIP_PLAN_TIMEOUT_MS=120000
```

Production must use the deployed FastAPI URL. The main backend retries transient/unreachable upstream failures and translates planner failures into API errors.
