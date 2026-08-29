# Python Trip Planner Service

This directory is a standalone FastAPI microservice used by the main Kavach backend for AI trip planning.
The original Python planning logic remains in `trip_core.py`; `main.py` only exposes it over HTTP.

## Architecture

```text
Frontend
  -> Main Node/Express backend
     -> Python FastAPI trip planner (this service)
        -> SerpAPI (places + hotels)
        -> Groq (daily itinerary)
```

The browser does **not** call this Python service directly. `Plan without AI` also does not call it.

## Environment

Copy `.env.example` to `.env` and provide:

```env
SERPAPI_API_KEY=...
GROQ_API_KEY=...
```

## Install

From `ai-ml/trip-planner`:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

From `ai-ml/trip-planner`:

```bash
uvicorn main:app --host 0.0.0.0 --port 4300 --reload
```

Health check:

```text
GET http://localhost:4300/health
```

Planning endpoint:

```text
POST http://localhost:4300/api/trip/plan
```

Example body:

```json
{
  "city": "Jaipur",
  "num_days": 3,
  "check_in": "2026-09-10",
  "check_out": "2026-09-13"
}
```

## Main backend configuration

In `server/.env`:

```env
TRIP_PLANNER_SERVICE_URL=http://127.0.0.1:4300
AI_TRIP_PLAN_TIMEOUT_MS=60000
```

For production, set `TRIP_PLANNER_SERVICE_URL` to the deployed FastAPI service URL.
