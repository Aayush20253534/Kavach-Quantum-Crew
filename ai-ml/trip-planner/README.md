# Trip Planner Module

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