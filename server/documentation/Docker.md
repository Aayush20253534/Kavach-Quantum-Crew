# Docker and Container Guide

> Current reference for `server/Dockerfile`, `server/docker-compose.yml`, and `server/docker-compose.test.yml` as of 29 August 2026.

## 1. What is containerized here

The `server/` directory contains the container definition for the main Express API. The normal Compose stack contains:

```text
backend container (Node.js / Express / Prisma)
        │
        ▼
postgres container (PostgreSQL 16 Alpine)
```

Redis, Mailjet, Google Places, Rakshak AI, FastAPI trip planner, and blockchain gateway are external/separate services. They are not bundled into the main backend image.

## 2. Backend Dockerfile

The Dockerfile is multi-stage:

```text
dependencies stage
  node:24.19.0-bookworm-slim
  → npm ci
  → copy Prisma schema/config
  → prisma generate using placeholder DATABASE_URL

runtime stage
  node:24.19.0-bookworm-slim
  → copy node_modules + application source
  → run as non-root node user
  → expose 4000
  → healthcheck GET /health
  → prisma migrate deploy
  → node src/server.js
```

Prisma generation does not need a live production database during image build. The placeholder URL exists only so Prisma can parse/generate the client.

## 3. Runtime migration behavior

Container startup uses:

```bash
npm run prisma:migrate:deploy && exec node src/server.js
```

This means:

1. `DATABASE_URL` must be available at runtime.
2. The database account needs migration permissions.
3. A bad migration prevents the app from starting, which is preferable to serving requests against an incompatible schema.
4. Never use `prisma migrate dev` in a production container.

## 4. Healthcheck

Docker checks:

```text
GET http://127.0.0.1:$PORT/health
```

with a 30-second interval, 5-second timeout, 20-second start period, and 3 retries. This is a liveness check. For deeper dependency readiness use `/health/ready` or `/health/database` operationally.

## 5. Normal Compose services

### PostgreSQL

`postgres:16-alpine` uses a named volume `smart-tourist-postgres` so local application data survives container recreation.

Configurable host-side values:

```env
POSTGRES_DB=smart_tourist_safety
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
```

The backend connects over the internal Compose network using hostname `postgres`, not `localhost`.

### Backend

The backend receives core runtime/database/auth/email/CORS/Redis environment values from Compose. Host port defaults to 4000:

```env
BACKEND_PORT=4000
```

## 6. Required secrets before `docker compose up`

At minimum configure real values for sensitive production-mode fields such as:

```env
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
EMAIL_OTP_SECRET=...
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_SENDER_EMAIL=verified-sender@example.com
MAILJET_SENDER_NAME=QuantumCrew
PUBLIC_APP_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

Do not bake any of those into the Dockerfile or image layers.

## 7. Redis through Compose

Compose passes the current optional Upstash cache settings:

```env
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
REDIS_KEY_PREFIX=sts
REDIS_DASHBOARD_TTL_SECONDS=30
REDIS_DESTINATIONS_TTL_SECONDS=900
REDIS_RISK_ZONES_TTL_SECONDS=30
REDIS_PLACES_TTL_SECONDS=21600
REDIS_ANALYTICS_TTL_SECONDS=20
```

Redis is not another Compose container in this file. The backend uses Upstash's HTTPS REST endpoint. If Redis is disabled/unavailable, cache helpers fall back to PostgreSQL/external source data.

## 8. What Redis does not cache

Do not interpret `REDIS_ENABLED=true` as generic response caching. Live GPS, emergency-service location, dispatch transitions, current trip state, group join requests, notifications, SOS state, and Socket.IO packets remain uncached operational state.

## 9. Building

From `server/`:

```bash
docker compose build
```

Force a clean rebuild only when needed:

```bash
docker compose build --no-cache
```

Build only the API:

```bash
docker compose build backend
```

## 10. Starting/stopping

Foreground:

```bash
docker compose up
```

Background:

```bash
docker compose up -d
```

Stop while keeping the database volume:

```bash
docker compose down
```

Delete the named volume/data intentionally:

```bash
docker compose down -v
```

The `-v` form is destructive for the Docker-managed PostgreSQL data.

## 11. Logs and inspection

```bash
docker compose logs -f backend
docker compose logs -f postgres
docker compose ps
```

Enter the backend container when debugging:

```bash
docker compose exec backend sh
```

## 12. Database commands in containers

The runtime image keeps the Prisma CLI because startup migrations require it. Useful commands:

```bash
docker compose exec backend npm run prisma:validate
docker compose exec backend npx prisma migrate status
docker compose exec backend npm run prisma:seed
```

Seed only environments where demo/test data is appropriate.

## 13. Test database Compose file

`docker-compose.test.yml` creates `postgres-test` on host port 5433 by default and stores database files in `tmpfs`, so the test database is intentionally ephemeral.

```bash
docker compose -f docker-compose.test.yml up -d
```

Typical test URL:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/smart_tourist_safety_test?schema=public
```

Destroy:

```bash
docker compose -f docker-compose.test.yml down
```

## 14. Connecting separately deployed services

The Compose file currently focuses on backend + PostgreSQL. To use external integrations set the main backend environment accordingly:

```env
AI_SERVICE_URL=http://host.docker.internal:4200
TRIP_PLANNER_SERVICE_URL=http://host.docker.internal:4300
BLOCKCHAIN_GATEWAY_URL=http://host.docker.internal:4100
```

On Linux, Docker host routing may differ. In production use actual deployed HTTPS service URLs.

## 15. FastAPI planner container/deployment expectations

The Python planner is not built by `server/Dockerfile`. Its standard process is:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

with:

```env
SERPAPI_API_KEY=...
GROQ_API_KEY=...
```

The main backend then uses its deployed origin in `TRIP_PLANNER_SERVICE_URL`.

## 16. Blockchain gateway container/deployment expectations

The blockchain gateway is independent. The main backend gets only gateway URL/key. Chain RPC, contract address, and issuer private key stay with `blockchain/`.

## 17. Mailjet in containers

Mailjet is HTTP-based. No SMTP port exposure is required. The shared client calls `https://api.mailjet.com/v3.1/send` from the backend container. Ensure outbound HTTPS is allowed and the configured sender is verified.

## 18. Reverse proxy / Render behavior

The repository does not run Nginx as an API gateway. Hosting platforms may proxy requests before they reach Express. On Render configure:

```env
TRUST_PROXY=true
HOST=0.0.0.0
```

Render supplies `PORT`; do not hardcode a different public port assumption.

## 19. CORS and cookies

When a Vercel frontend calls a Render backend, align:

- `CORS_ORIGINS` with the exact frontend origin,
- `CORS_CREDENTIALS=true`,
- secure refresh-cookie settings appropriate for cross-site production traffic,
- frontend Axios credentials behavior.

Container health does not prove browser CORS/cookie correctness.

## 20. Production verification

After starting a containerized/released backend, verify:

1. `/health`, `/health/ready`, `/health/database`.
2. register → Mailjet OTP → verify → login/refresh.
3. Prisma schema includes `Trip.aiPlan` and group lock fields.
4. manual trip planning auto-starts and cannot later add AI.
5. AI plan generation reaches deployed FastAPI and saving starts the trip.
6. locked groups reject new join mutations and the client stops polling.
7. Redis cache hit/miss/fail-open behavior works when enabled.
8. Socket.IO connects through the deployment proxy.
9. SOS → incident → dispatch → emergency-service live location works.
10. blockchain and Rakshak AI degrade independently if disabled/unavailable.

## 21. Security checklist

- Never commit `.env`.
- Never place provider secrets in `VITE_*`.
- Never copy blockchain issuer private key into `server/`.
- Never log Mailjet secret or OTP values.
- Run the application container as non-root (the Dockerfile already uses `USER node`).
- Keep database ports private in production where possible.
- Restrict CORS rather than using a wildcard with credentials.
- Rotate leaked credentials immediately.
