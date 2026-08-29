# Deployment Guide

> Current multi-service deployment reference for KAVACH.

## 1. Deployable units

| Unit | Directory | Runtime | Purpose |
|---|---|---|---|
| Web client | `client/` | React/Vite static | tourist/authority/admin/fleet UI |
| Main API | `server/` | Node.js/Express | application source of truth/API/realtime/jobs |
| Rakshak AI | `ai-ml/` | Node.js/TypeScript | authenticated chatbot + Groq + KB/history |
| Trip planner | `ai-ml/trip-planner/` | Python/FastAPI | itinerary/hotel generation |
| Blockchain gateway | `blockchain/` | Node.js/TypeScript | isolated signer + contract gateway |

Managed dependencies commonly include PostgreSQL/Neon and Upstash Redis.

## 2. Recommended production topology

```text
Users
  │
  ▼
Vercel client
  │ HTTPS / Socket.IO
  ▼
Render main backend ─────────► PostgreSQL/Neon
  │                           Upstash Redis
  ├────────► Mailjet
  ├────────► Google Maps/Places
  ├────────► Render Rakshak AI
  ├────────► Render FastAPI planner
  └────────► Render blockchain gateway ─► EVM RPC/contract
```

There is no Nginx gateway service in this repository. Express implements request rate limiting/security middleware; hosting platforms may proxy traffic externally.

## 3. Main backend build/release

From `server/`:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm start
```

A common Render build command is:

```bash
npm ci && npm run prisma:generate && npm run prisma:migrate:deploy
```

Start:

```bash
npm start
```

## 4. Main backend production variables

Configure at least:

```env
NODE_ENV=production
HOST=0.0.0.0
TRUST_PROXY=true
DATABASE_URL=...
CORS_ORIGINS=https://your-frontend.vercel.app
CORS_CREDENTIALS=true
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
EMAIL_OTP_SECRET=...
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_SENDER_EMAIL=verified-sender@example.com
MAILJET_SENDER_NAME=QuantumCrew
PUBLIC_APP_URL=https://your-frontend.vercel.app
AI_SERVICE_URL=https://your-rakshak-ai.onrender.com
TRIP_PLANNER_SERVICE_URL=https://your-trip-planner.onrender.com
AI_TRIP_PLAN_TIMEOUT_MS=120000
```

Optional Redis:

```env
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Optional blockchain:

```env
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_GATEWAY_URL=https://your-chain-gateway.onrender.com
BLOCKCHAIN_GATEWAY_KEY=...
BLOCKCHAIN_DATA_ENCRYPTION_KEY=...
```

## 5. Mailjet readiness

Before production email tests:

1. add/verify `MAILJET_SENDER_EMAIL` in Mailjet,
2. configure API key + secret,
3. deploy backend,
4. run a real registration/verification test,
5. run password-reset email test,
6. trigger a non-production emergency/dispatch email test account if operationally safe.

The sender can be a verified individual sender supported by the Mailjet account; domain authentication improves deliverability but the code itself only requires the configured sender/provider credentials.

## 6. FastAPI trip planner deployment

Root directory:

```text
ai-ml/trip-planner
```

Build:

```bash
pip install -r requirements.txt
```

Start:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Environment:

```env
SERPAPI_API_KEY=...
GROQ_API_KEY=...
```

Smoke test:

```text
GET /health
POST /api/trip/plan
```

After deploying, copy the service origin into main backend `TRIP_PLANNER_SERVICE_URL`. Do not use `127.0.0.1` in production when the planner is a separate service.

## 7. Rakshak AI deployment

The current source is TypeScript/Node (`ai-ml/server.ts`) with PostgreSQL chat history and Groq. Configure:

```env
DATABASE_URL=...
KAVACH_API_URL=https://main-backend.example/api/v1
GROQ_API_KEY=...
GROQ_MODEL=...
AI_REQUIRE_AUTH=true
ACCESS_TOKEN_SECRET=<same access secret as backend>
JWT_ISSUER=<same>
JWT_AUDIENCE=<same>
CORS_ORIGINS=https://frontend.example
```

`ai-ml/render.yaml` in this snapshot contains legacy Python/OpenAI/Chroma settings that do not match the current TypeScript service source. Treat the current source/package scripts and environment example as authoritative until that deployment manifest is updated.

## 8. Blockchain gateway deployment

Build/start according to `blockchain/package.json`:

```bash
npm ci
npm run build
npm start
```

Gateway environment owns:

```env
CHAIN_RPC_URL=...
CHAIN_ID=...
CONTRACT_ADDRESS=...
ISSUER_PRIVATE_KEY=...
GATEWAY_API_KEY=...
```

The main backend must not receive the issuer private key.

## 9. Client deployment

From `client/`:

```bash
npm ci
npm run build
```

Public environment:

```env
VITE_API_URL=https://main-backend.example/api/v1
VITE_PUBLIC_APP_URL=https://frontend.example
VITE_SOCKET_URL=https://main-backend.example
VITE_AI_SERVICE_URL=https://rakshak-ai.example
```

Never place database, Mailjet, Groq, SerpAPI, Upstash, or blockchain secrets in Vite variables.

## 10. Database migration order

The main API must deploy committed Prisma migrations before serving code that reads new columns. Current important additions include group lock fields and `Trip.aiPlan` JSON. Use:

```bash
npm run prisma:migrate:deploy
npx prisma migrate status
```

Never manually add production columns and then forget the migration file; the next environment will reproduce the mismatch with admirable efficiency.

## 11. Redis production behavior

Redis is optional and fail-open. Production cache settings can tune TTLs, but should preserve the design boundary:

- cache destination/reference/aggregate/external lookup reads,
- invalidate risk-zone caches on writes,
- never generic-cache live GPS/dispatch/SOS/group join state.

## 12. Socket.IO deployment

Ensure the hosting proxy supports WebSocket upgrades. Use the same access JWT contract as REST. Client should reconnect and then bootstrap current state through REST because Socket.IO packets are not historical storage.

## 13. CORS / refresh cookies

With Vercel frontend and Render API:

- use exact `CORS_ORIGINS`,
- enable credentials,
- configure secure refresh-cookie attributes for cross-site production,
- set `TRUST_PROXY=true` so rate limiting uses forwarded client IP correctly.

## 14. Health/readiness

Main backend:

```text
GET /
GET /health
GET /health/ready
GET /health/database
GET /api/v1/health
```

Trip planner:

```text
GET /health
```

Blockchain gateway has its own health/readiness endpoints defined by gateway source.

## 15. Post-deploy functional smoke test

Run the actual product journey, not merely health endpoints:

```text
register
 → receive Mailjet OTP
 → verify/login
 → create trip
 → group join/lock if GROUP
 → choose AI/manual plan
 → ensure trip auto-starts
 → verify later AI attempt is unavailable/rejected
 → publish tracking
 → trigger test SOS in non-production data
 → DM dispatch
 → fleet accepts + updates location
 → tourist sees fleet live
 → resolve dispatch/incident
```

For AI planning also confirm a planner hotel-provider failure still allows itinerary-only success where expected.

## 16. Rollback strategy

- Application rollback must remain compatible with already-applied DB schema.
- Do not automatically roll back destructive migrations with ad-hoc SQL.
- Keep prior deployment image/revision available.
- Disable optional Redis/AI/blockchain integration flags if an external service is causing failures while preserving core safety functionality.

## 17. Secret handling

Rotate immediately if exposed:

- database credentials,
- JWT/refresh secrets,
- Mailjet keys,
- OTP/QR secrets,
- Upstash token,
- Groq/SerpAPI keys,
- Google server API key,
- blockchain gateway key/encryption key,
- issuer private key.
