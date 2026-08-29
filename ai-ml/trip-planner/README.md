# KAVACH FastAPI Trip Planner

This directory is a separately deployable Python microservice used by the main Express backend for itinerary generation.

## API

### `GET /health`

Returns service readiness/configuration flags for SerpAPI and Groq.

### `POST /api/trip/plan`

```json
{
  "city": "Prayagraj",
  "num_days": 2,
  "check_in": "2026-08-29",
  "check_out": "2026-08-31"
}
```

The response contains an `itinerary` object and a `hotels` object. The backend integration requires those top-level structures. Hotel-provider errors are intentionally degradable: the itinerary can still be returned with `hotels.hotels=[]` plus warnings rather than failing the complete plan.

## Generation pipeline

```text
request
 → get_top_places(city) through SerpAPI
 → select top source places
 → Groq structured JSON itinerary
 → re-attach URL/thumbnail only from SerpAPI source data
 → get_hotels(city, dates) through SerpAPI Google Hotels
 → select representative hotel price buckets
 → build response
```

The LLM is explicitly instructed to use only supplied place names. It does not invent URLs or thumbnails; those are reattached from source lookup data after structured generation.

## Environment

```env
SERPAPI_API_KEY=...
GROQ_API_KEY=...
```

## Local run

```bash
python -m venv .venv
# activate environment
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 4300 --reload
```

## Main backend configuration

```env
TRIP_PLANNER_SERVICE_URL=http://127.0.0.1:4300
AI_TRIP_PLAN_TIMEOUT_MS=120000
```

Production must use the deployed planner URL. The Node integration rejects a production localhost URL, retries selected transient failures, and translates upstream timeout/unavailable/invalid-response failures into stable API errors.

## Client lifecycle

The React client receives destination/dates from the normal Trips flow. It calls the Node backend, previews the generated plan, then the permitted trip owner saves the plan. Saving is only allowed while `Trip.status=PLANNED`; current UI then starts the trip, permanently closing the planning window.

---

## Additional implementation notes retained from the original planner documentation


Generates a multi-day travel itinerary (via SerpAPI + Groq LLM) and a
price-tiered hotel list for a given city. Ships as an Express `Router` —
plug it into any existing Express app.

---

## 1. What this module does

- Fetches top places to visit in a city (SerpAPI)
- Fetches hotels with pricing for given check-in/check-out dates (SerpAPI)
- Sends the places list to an LLM (Groq) to build a day-by-day itinerary
- Picks one representative hotel per price bracket (cheapest → priciest)
- Exposes all of this as a single endpoint: `POST /api/trip/plan`

Response shape is documented separately in `API_RESPONSE.md` (the doc your
frontend team already has). This README only covers backend
integration/deployment.

---

## 2. Folder structure

```
trip-planner/
├── package.json
├── .env.example
└── src/
    ├── schemas.js       # zod validation schemas
    ├── tools.js         # SerpAPI calls (places + hotels)
    ├── itinerary.js      # Groq LLM call -> itinerary generation
    ├── hotels.js         # price-bucket hotel selection logic
    ├── tripPlanner.js    # orchestrates tools + itinerary + hotels
    ├── tripRouter.js     # <-- the Express Router you actually import
    └── server.js         # standalone demo server (optional, not needed
                           #  if you're integrating into an existing app)
```

You only need `src/` (minus `server.js`) inside your main project. Copy
the whole `src/` folder in, or `npm install` this as a local package —
either works, just keep the relative imports between files intact.

---

## 3. Required environment variables

Create a `.env` file (see `.env.example`) with:

| Variable | Required | Description |
|---|---|---|
| `SERPAPI_API_KEY` | yes | SerpAPI key — used for both places and hotels lookups. Get one at [serpapi.com](https://serpapi.com/manage-api-key) |
| `GROQ_API_KEY` | yes | Groq API key — used for itinerary generation. Get one at [console.groq.com](https://console.groq.com/keys) |
| `PORT` | no | Only used by the standalone `server.js` demo. Not needed if mounting into your own app. |

**No API keys are hardcoded anywhere in the code.** Both are read from
`process.env` at request time — if either is missing, the relevant call
fails fast with a clear error message instead of silently breaking.

⚠️ Make sure `.env` is in your `.gitignore` and is never committed.

---

## 4. Install dependencies

From inside the `trip-planner/` folder (or after copying `src/` into your
project, merge these into your existing `package.json`):

```bash
npm install axios dotenv express groq-sdk zod
```

---

## 5. Integrating into your main Express server

This is the only step that matters for integration — import the router
and mount it.

```js
// main server file, e.g. app.js / index.js
import express from "express";
import tripRouter from "./trip-planner/src/tripRouter.js"; // adjust path

const app = express();
app.use(express.json()); // required — router reads req.body

app.use("/api/trip", tripRouter); // mounts POST /plan -> full path /api/trip/plan

app.listen(3000, () => console.log("Server running"));
```

That's it. `tripRouter.js` only defines the route `POST /plan` — wherever
you `app.use()` it determines the full path. Mount it at `/api/trip` to
match the documented `POST /api/trip/plan` contract.

> **Important:** `express.json()` middleware must be registered on the
> app (or router) before the trip router, otherwise `req.body` will be
> `undefined` and every request will 400.

---

## 6. Request contract

```
POST /api/trip/plan
Content-Type: application/json
```

```json
{
  "city": "Allahabad",
  "num_days": 3,
  "check_in": "2026-09-10",
  "check_out": "2026-09-13"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `city` | string | **yes** | Rejected with `400` if missing/not a string |
| `num_days` | number | **yes** | Rejected with `400` if missing or `< 1` |
| `check_in` | string `YYYY-MM-DD` | no | Defaults to today + 7 days if omitted |
| `check_out` | string `YYYY-MM-DD` | no | Defaults to today + 10 days if omitted |

Response body: `{ itinerary: {...}, hotels: {...} }` — full field-level
breakdown is in the frontend-facing API response doc already shared with
the team.

---

## 7. Error handling behavior

| Situation | Status | Body |
|---|---|---|
| Missing/invalid `city` | `400` | `{ "error": "'city' (string) is required" }` |
| Missing/invalid `num_days` | `400` | `{ "error": "'num_days' (positive number) is required" }` |
| Missing `SERPAPI_API_KEY` or `GROQ_API_KEY` | `500` | `{ "error": "Failed to generate trip plan", "details": "..." }` |
| SerpAPI error response | `500` | same shape, `details` contains the SerpAPI error message |
| Any other unexpected failure | `500` | same shape |

All errors are also logged server-side via `console.error` — check your
process logs / log aggregator for the `details` field on `500`s.

---

## 8. Quick local smoke test

If you want to sanity-check the module in isolation before wiring it in,
run the included standalone demo:

```bash
cp .env.example .env
# fill in SERPAPI_API_KEY and GROQ_API_KEY in .env
npm install
node src/server.js
```

Then:

```bash
curl -X POST http://localhost:3000/api/trip/plan \
  -H "Content-Type: application/json" \
  -d '{"city":"Allahabad","num_days":3,"check_in":"2026-09-10","check_out":"2026-09-13"}'
```

If this returns a valid JSON payload, the module works — you can delete
`src/server.js` and proceed to mount `tripRouter.js` into your main app
as described in Section 5.

---

## 9. Notes / things to double check before deploying

- **Rate limits**: SerpAPI and Groq both have rate/usage limits on free
  tiers — check your plan before load testing.
- **Latency**: this endpoint makes 3 sequential external calls (places →
  hotels → LLM), so expect a few seconds per request. Consider a loading
  state on the client and/or a request timeout on your gateway/proxy.
- **No caching**: every call hits SerpAPI + Groq fresh. If the same
  city/dates get requested often, adding a cache layer (Redis, etc.) in
  front of `buildTripResponse()` would cut cost and latency — not
  implemented here, since the original logic was ported as-is.
