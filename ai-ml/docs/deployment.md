# AI/ML Deployment Guide

KAVACH deploys Rakshak AI and the Python Trip Planner as separate services.

## 1. Rakshak AI local setup

```bash
cd ai-ml
cp .env.example .env
npm install
npm run dev
```

Default local port: `4200`.

Production build:

```bash
npm ci
npm run build
npm start
```

`npm start` runs `dist/server.js` after TypeScript compilation.

## 2. Rakshak required environment

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=4200
DATABASE_URL=postgresql://...
DB_POOL_MAX=5
KAVACH_API_URL=https://<main-backend>/api/v1
CORS_ORIGINS=https://<frontend>
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
KB_DIR=kb
CHATBOT_MAX_HISTORY=10
CHATBOT_MAX_MESSAGE_LENGTH=2000
AI_REQUIRE_AUTH=true
ACCESS_TOKEN_SECRET=<same access-token secret as main backend>
JWT_ISSUER=smart-tourist-safety
JWT_AUDIENCE=smart-tourist-safety-client
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
```

`KAVACH_API_URL` must include `/api/v1`. The `.env.example` may be copied and corrected for the actual local/main-backend port in your environment.

## 3. Rakshak startup behavior

Before listening, Rakshak calls `ensureChatSchema()`. Startup therefore requires a reachable PostgreSQL database with permission to create the three AI tables/indexes when absent.

If schema initialization fails, the process exits instead of starting half-functional.

## 4. Rakshak health checks

Use:

```text
GET /
GET /health
```

`/health` reports configuration flags but does not call Groq or PostgreSQL. It is a liveness/configuration check rather than a full dependency-readiness test.

## 5. Frontend configuration

Set:

```env
VITE_AI_SERVICE_URL=https://<rakshak-service>
```

The browser sends the user's access JWT in the Authorization header.

## 6. Python Trip Planner local setup

```bash
cd ai-ml/trip-planner
python -m venv .venv
# activate the environment
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 4300
```

Environment:

```env
SERPAPI_API_KEY=...
GROQ_API_KEY=...
```

## 7. Python service health

Use:

```text
GET /
GET /health
```

The root endpoint is intentionally cheap and does not invoke providers. `/health` reports whether the two provider keys are present.

## 8. Main-backend integration

The Node backend should point to the Python **service root**, not the full plan endpoint:

```env
TRIP_PLANNER_SERVICE_URL=https://<python-service>
AI_TRIP_PLAN_TIMEOUT_MS=120000
```

The backend appends `/api/trip/plan` itself.

Do not configure production with `localhost`; each Render service has its own network namespace/process environment.

## 9. Deployment order

A clean deployment sequence is:

```text
1. PostgreSQL/main backend
2. Rakshak AI with matching JWT settings
3. Python planner with SerpAPI/Groq keys
4. frontend with VITE_AI_SERVICE_URL
5. main backend with TRIP_PLANNER_SERVICE_URL
```

## 10. Smoke tests

Rakshak:

```bash
curl https://<rakshak>/health
```

Python:

```bash
curl https://<planner>/health
```

Planner generation:

```bash
curl -X POST https://<planner>/api/trip/plan \
  -H 'content-type: application/json' \
  -d '{"city":"Prayagraj","num_days":2,"check_in":"2026-09-01","check_out":"2026-09-03"}'
```

Integrated generation should finally be tested through the main backend because that is where trip authorization and one-time planning rules are enforced.

## 11. Repository note about `render.yaml`

The current runtime implementation is TypeScript/Express for Rakshak, while the checked-in `ai-ml/render.yaml` still describes an older Python/embedding deployment shape. Treat the code and this deployment guide as authoritative unless that manifest is separately modernized. Do not deploy Rakshak from that stale manifest without reviewing it.
