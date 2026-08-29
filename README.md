# KAVACH — Smart Tourist Safety Network

KAVACH is a multi-service tourist-safety platform that combines trip management, group journeys, live location tracking, safety monitoring, SOS and incident response, emergency-fleet dispatch, AI-assisted trip planning, an authenticated safety chatbot, and blockchain-backed trip credentials.

> Documentation synchronized with the repository on **29 August 2026**. Runtime source, Prisma migrations, route definitions, and `.env.example` files remain the final source of truth.

## Why KAVACH exists

Tourist-safety systems tend to split trip planning, live tracking, emergency escalation, responder coordination, and identity verification into unrelated products. KAVACH keeps those workflows connected around one trip lifecycle so the tourist, group leader, Disaster Management team, and emergency fleet all see the state relevant to them.

## Architecture

```text
                         ┌──────────────────────┐
                         │  React / Vite client │
                         │  Tourist + Ops UIs   │
                         └──────────┬───────────┘
                                    │ REST + Socket.IO
                                    ▼
┌──────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐
│ Rakshak AI service   │◄──│ Main Express API         │──►│ Blockchain gateway   │
│ Express + Groq + KB  │   │ Prisma + PostgreSQL      │   │ ethers + TrustAnchor │
│ persistent chat      │   │ jobs + realtime + email  │   │ isolated signer      │
└──────────────────────┘   └──────────┬───────────────┘   └──────────┬───────────┘
                                      │                               │
                                      ▼                               ▼
                              ┌──────────────┐                 ┌──────────────┐
                              │ PostgreSQL   │                 │ EVM / Sepolia│
                              └──────────────┘                 └──────────────┘

                         ┌──────────────────────────┐
                         │ FastAPI trip planner     │
                         │ SerpAPI + Groq           │
                         └──────────────────────────┘
```

### Deployable services

| Directory | Runtime | Responsibility |
|---|---|---|
| `client/` | React 19 + Vite | Browser UI for tourists, Disaster Management, System Admin, Police, Fire and Ambulance |
| `server/` | Node.js + Express 5 | Main API, authentication, trip/group lifecycle, realtime, incidents, dispatch, notifications and jobs |
| `ai-ml/` | TypeScript + Express | Rakshak AI chatbot, knowledge-base retrieval, Groq inference and persistent chat history |
| `ai-ml/trip-planner/` | Python + FastAPI | AI itinerary and hotel recommendation microservice |
| `blockchain/` | Hardhat + ethers | `TrustAnchor.sol` and the authenticated signing gateway |

## Core product flows

### Tourist trip lifecycle

A trip starts from one destination/date form. The AI planner never asks the tourist to re-enter those values.

```text
Destination + dates + SOLO/GROUP
        │
        ├─ SOLO ──────────────────────────────┐
        │                                     │
        └─ GROUP → create group → members join│
                    → leader approves         │
                    → leader locks membership │
                                              ▼
                                   Choose planning mode once
                                   ├─ Plan without AI
                                   │    → start trip immediately
                                   │
                                   └─ Plan with AI
                                        → generate plan
                                        → save plan
                                        → start trip immediately
```

Planning is a one-time pre-start decision. Once a trip becomes `ACTIVE`, AI planning cannot be attached or regenerated. For group trips only the leader can generate/save the AI plan; all members can read the saved plan from the current-trip view.

### Group membership and QR flow

```text
leader creates group
  → group credential / QR available
  → tourist scans or opens join link
  → join request created
  → leader approves/rejects
  → leader locks group
  → new invitations, joins and approvals are blocked
```

The group QR identifies the group; it does not silently add a member. Locking is enforced by the backend, not merely by hidden controls in the client.

### Emergency response

```text
Tourist SOS / safety incident / escalated signal loss
        → Disaster Management
        → choose Police / Fire / Ambulance
        → nearest available unit assignment
        → responder receives dispatch
        → responder publishes live GPS
        → tourist + operations see live response tracking
        → dispatch progresses to completion
```

Responder distance-to-destination is derived from the responder's current position and the incident destination. Tourist live tracking can display both group members and the active emergency fleet in the same operational view.

### AI services

KAVACH uses two separate AI-related runtimes:

1. **Rakshak AI (`ai-ml/`)** — authenticated conversational safety assistant with Markdown knowledge retrieval, Groq inference, persistent per-user chat history and selected live backend context.
2. **Trip planner (`ai-ml/trip-planner/`)** — FastAPI service called only by the main backend. It creates itinerary data from SerpAPI place results and Groq, plus hotel recommendations. A hotel lookup failure is non-fatal: the itinerary can still be returned with an empty hotel list and warnings.

The browser does not call the Python trip planner directly.

### Transactional email

Transactional mail is delivered through **Mailjet Send API v3.1**. The main backend owns OTP, account, incident, dispatch and emergency email delivery. The configured sender address must be verified in Mailjet.

Required production variables:

```env
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_SENDER_EMAIL=verified-sender@example.com
MAILJET_SENDER_NAME=QuantumCrew
```

## Roles

| Role | Primary responsibilities |
|---|---|
| `TOURIST` | trips, groups, tracking, SOS, incidents, credentials, chatbot and notifications |
| `DISASTER_MANAGER` | incident command, risk/hazard operations, responder provisioning and dispatch |
| `SYSTEM_ADMIN` | platform administration, audit, analytics and diagnostics |
| `POLICE` | assigned police dispatches and live unit location |
| `FIRE` | assigned fire dispatches and live unit location |
| `AMBULANCE` | assigned medical dispatches and live unit location |

Authorization is enforced by backend middleware. Client-side route visibility is not treated as a security boundary.

## Repository layout

```text
.
├── client/                      # React/Vite application
│   ├── src/
│   └── docs/
├── server/                      # Main API
│   ├── prisma/
│   ├── src/modules/
│   ├── src/integrations/
│   ├── src/jobs/
│   ├── src/realtime/
│   └── documentation/
├── blockchain/                  # TrustAnchor + gateway
│   ├── contracts/
│   ├── gateway/
│   ├── scripts/
│   └── docs/
└── ai-ml/
    ├── server.ts                # Rakshak AI service
    ├── kb/                      # retrieval knowledge base
    ├── docs/
    └── trip-planner/            # FastAPI itinerary service
```

## Request and data flow

```text
HTTP request
 → security/request-id/logging/CORS/rate-limit middleware
 → feature route
 → authenticate / authorize / Zod validate
 → controller
 → service business rules
 → repository / Prisma or external integration
 → PostgreSQL source-of-truth mutation/read
 → optional cache invalidation/population
 → optional Socket.IO + Mailjet + blockchain job side effects
 → response
```

### Performance strategy

KAVACH uses Redis selectively rather than caching everything because fast stale data is still stale data. Destination discovery, safety/risk-zone reference reads, jurisdiction Places lookups, dashboard counters, and analytics aggregates get bounded TTL caching. Risk-zone writes invalidate affected cache families. Live GPS, dispatch status/location, group membership, current trip, notifications and SOS state are intentionally left uncached and use persistent state plus Socket.IO.

### Endpoint families

The main API currently mounts authentication, tourists, trips, groups, credentials, tracking, safety, signal-loss, alerts, SOS, incidents, Disaster Management, notifications/delivery, escalations, hazards, risk zones, monitoring, dispatch, emergency services, evidence, System Admin, analytics, chatbot proxy/integration endpoints, dashboard, destinations, integrations, audit and observability under `/api/v1`.

See `server/documentation/ENDPOINTS.md` for the route-level catalogue and `server/documentation/SYSTEM-FLOW.md` / `TECHNICAL-FLOW.md` for end-to-end execution.

## Prerequisites

- Node.js 20.19+ and npm
- PostgreSQL
- Python 3.11+ for the trip planner
- an EVM RPC endpoint when blockchain integration is enabled
- external credentials as needed: Mailjet, Groq, SerpAPI, Google Maps/Places, Cloudinary and Upstash Redis

Redis is used selectively for read-heavy data that benefits from short-lived caching: destination discovery, safety/risk-zone reference data used during repeated safety evaluation, Google Places jurisdiction lookups, dashboard counters and analytics aggregates. Live GPS, dispatch state, group membership, notifications and other Socket.IO-driven operational state remain uncached.

## Local development

### Main backend

```bash
cd server
cp .env.example .env
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Default API base: `http://localhost:4000/api/v1`

### Client

```bash
cd client
cp .env.example .env
npm ci
npm run dev
```

Default browser URL: `http://localhost:5173`

### Rakshak AI

```bash
cd ai-ml
cp .env.example .env
npm ci
npm run dev
```

Default service URL: `http://localhost:4200`

`KAVACH_API_URL` should point to the main backend API base, normally `http://localhost:4000/api/v1` locally.

### Python trip planner

```bash
cd ai-ml/trip-planner
python -m venv .venv
# activate the virtual environment
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 4300 --reload
```

Health check: `GET http://localhost:4300/health`

Main-backend integration:

```env
TRIP_PLANNER_SERVICE_URL=http://127.0.0.1:4300
AI_TRIP_PLAN_TIMEOUT_MS=120000
```

In production `TRIP_PLANNER_SERVICE_URL` must be the deployed FastAPI URL, never localhost.

### Blockchain gateway

```bash
cd blockchain
cp .env.example .env
npm ci
npm run node
# deploy contract in another terminal
npm run deploy:localhost
npm run gateway
```

The gateway key in `blockchain/.env` must match `server/.env:BLOCKCHAIN_GATEWAY_KEY`.

## Production deployment

A common deployment is:

```text
Vercel                 Render                  Render
client/ ─────────────► server/ ─────────────► blockchain gateway
                          │  └───────────────► FastAPI trip planner
                          ├──────────────────► Rakshak AI
                          ▼
                      PostgreSQL / Neon
```

The main backend should use `TRUST_PROXY=true` behind Render. Secrets belong only in service environment variables. Never expose blockchain private keys, Mailjet secrets, JWT secrets, database URLs or API-provider secrets in `VITE_*` variables.

## Important environment groups

Main backend (`server/.env`):

- database and Prisma: `DATABASE_URL`
- auth: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, JWT issuer/audience
- email: `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, sender fields, OTP secret
- client integration: `CORS_ORIGINS`, `PUBLIC_APP_URL`
- blockchain: `BLOCKCHAIN_ENABLED`, gateway URL/key, encryption key
- AI: `AI_SERVICE_URL`, `TRIP_PLANNER_SERVICE_URL`, planner timeout
- optional providers: Cloudinary, Google Maps, Upstash Redis

Use the `.env.example` files in each service as the canonical variable list.

## Quality checks

```bash
# server
cd server
npm run env:check
npm run prisma:validate
npm run lint
npm test

# client
cd ../client
npm run lint
npm run build

# ai service
cd ../ai-ml
npm run typecheck
npm run build

# blockchain
cd ../blockchain
npm test
npm run build
```

The backend still contains historical test-directory names in npm scripts. Those names describe the test organization only; product documentation is organized by subsystem rather than implementation phases.

## Documentation map

| Area | Start here |
|---|---|
| Main backend | `server/README.md` |
| Backend architecture | `server/documentation/ARCHITECTURE.md` |
| REST routes | `server/documentation/ENDPOINTS.md` and `server/openapi.yaml` |
| Environment | `server/documentation/ENVIRONMENT.md` |
| Realtime | `server/documentation/REALTIME-EVENTS.md` |
| Email | `server/documentation/EMAIL-VERIFICATION.md`, `NOTIFICATION-DELIVERY.md` |
| Client | `client/README.md`, `client/docs/Architecture.md` |
| AI chatbot | `ai-ml/README.md` |
| AI trip planner | `ai-ml/trip-planner/README.md` |
| Blockchain | `blockchain/README.md` |

## Data and security boundaries

- PostgreSQL is the primary application-state store.
- Refresh sessions are persisted and access is role-aware.
- Group lock, trip state, ownership and responder authorization are enforced server-side.
- The blockchain signer is isolated in the gateway; the browser and main API never receive the issuer private key.
- Sensitive plaintext tourist information is not intentionally written directly to the public chain. Blockchain snapshots use encrypted payloads plus hashes.
- AI chat history is scoped to the authenticated user.
- Trip AI plans can only be attached while a trip is `PLANNED`.
- Mailjet, Groq, SerpAPI and other provider credentials remain server-side.

## License

No repository license file is present in this snapshot. Add an explicit license before distributing the project as open source.
