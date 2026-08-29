# KAVACH — Smart Tourist Safety Network

KAVACH is a full-stack tourist-safety platform for trip management, live safety monitoring, incident response, emergency coordination, and privacy-preserving blockchain-backed trip credentials.

The repository is split into four workspaces:

```text
frontend/   React 19 + Vite user interfaces
server/     Node.js + Express API, realtime runtime, jobs, Prisma/PostgreSQL
blockchain/ Solidity trust anchor + authenticated EVM gateway
ai-ml/      AI/ML design documents; no standalone AI runtime is implemented here yet
```

> **Documentation status:** verified against the repository source on **24 August 2026**. Runtime code and environment examples remain the final source of truth when implementation and historical planning documents disagree.

## System architecture

```text
┌──────────────────────────────┐
│ React / Vite frontend        │
│ Tourist · Authority · Admin  │
└──────────────┬───────────────┘
               │ HTTPS / REST
               │ Socket.IO
               ▼
┌──────────────────────────────┐
│ Express API                  │
│ auth · trips · groups        │
│ tracking · safety · SOS      │
│ incidents · dispatch         │
│ hazards · analytics · admin  │
└───────┬───────────┬──────────┘
        │           │
        │ Prisma    │ internal authenticated HTTP
        ▼           ▼
┌──────────────┐  ┌──────────────────────────┐
│ PostgreSQL   │  │ Blockchain gateway       │
│ system truth │  │ isolated signing service │
└──────────────┘  └─────────────┬────────────┘
                                │ JSON-RPC
                                ▼
                       ┌─────────────────┐
                       │ EVM TrustAnchor │
                       └─────────────────┘
```

The browser never receives blockchain private keys. The Express service does not sign chain transactions itself. `blockchain/gateway/server.ts` is the isolated signing boundary and is authenticated with a shared gateway key.

## Implemented capabilities

### Tourist experience

- registration, email OTP verification, login, refresh sessions, logout, and onboarding
- profile management and profile-image upload
- solo and group trip lifecycle management
- group creation, invitation, QR-based discovery, join requests, leader approval, leave/remove flows
- trip-scoped individual and group QR credentials
- live location tracking, check-ins, geofencing, safety status, and dashboard data
- SOS submission, incident reporting/history, notifications, and trip history
- public credential verification route
- tourist chatbot API contract exists, although the current frontend widget still uses a simulated response and the backend provider must be injected/configured before it can answer

### Authority / disaster-management experience

- incident queue and incident details
- hazard moderation
- responder availability/capacity and emergency-unit operations
- dispatch lifecycle
- risk-zone management and monitoring
- incident communication and evidence handling
- operational analytics

### System administration

- admin dashboard and account/resource management
- audit queries
- observability metrics and diagnostics
- location/resource administration

### Platform services

- JWT + persisted refresh-session authentication
- role-based authorization for `TOURIST`, `DISASTER_MANAGER`, and `SYSTEM_ADMIN`
- Socket.IO realtime events
- scheduled trip lifecycle and blockchain anchor jobs
- Redis-compatible caching through Upstash REST when enabled
- provider boundaries for email, push/SMS, storage, Google Maps, AI, and blockchain
- structured logging, request IDs, privacy headers, rate limits, body/request-shape limits, and graceful shutdown

## Blockchain-backed QR credentials

KAVACH uses two trip-scoped credential types:

| Credential | Owner | Primary use |
|---|---|---|
| `INDIVIDUAL` | one active trip participant | prove an individual belongs to an active trip |
| `GROUP` | one group trip | identify an active group and support QR join discovery |

PostgreSQL stores application state, QR metadata, credential ownership, retry jobs, and lifecycle state. The chain stores hash-derived credential identifiers/status metadata plus append-only **encrypted** identity/group snapshot ciphertext and snapshot hashes. Plaintext names, DOBs, emails, phone numbers, precise GPS coordinates, medical information, and government IDs are not written on-chain.

Credential lifecycle:

```text
trip/group/member event
        │
        ▼
create or update DB credential
        │
        ▼
BlockchainAnchorJob (async)
        │
        ▼
POST blockchain gateway
        │
        ▼
TrustAnchor issueId / extendId / revokeId
```

The gateway provides idempotent handling for already-applied issue/extend/revoke operations. The server worker persists attempts and retries asynchronous anchor jobs. A failed chain operation must not be disguised in the UI as successful.

### Group QR join security

The large group QR represents the active group credential hash as `KAVACH_GROUP:<idHash>`. Scanning identifies the group, but does **not** silently add the tourist. The flow is:

```text
scan QR → preview active group → request join → leader approves → membership created → individual credential issued
```

This double-confirmation flow limits the damage from copied or forwarded QR codes.

## Repository layout

```text
.
├── README.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── services/
│   │   └── store/
│   └── docs/
├── server/
│   ├── prisma/
│   ├── scripts/
│   ├── src/
│   │   ├── modules/
│   │   ├── integrations/
│   │   ├── realtime/
│   │   ├── jobs/
│   │   └── middleware/
│   └── documentation/
├── blockchain/
│   ├── contracts/
│   ├── adapter/
│   ├── gateway/
│   ├── scripts/
│   ├── test/
│   └── docs/
└── ai-ml/
    └── docs/
```

## Prerequisites

- Node.js **20.19+** and npm **10+**
- PostgreSQL
- an EVM JSON-RPC endpoint for blockchain-backed credentials, or a local Hardhat node
- optional external services depending on enabled features: Mailjet, Cloudinary, Google Maps, Upstash Redis, notification providers

## Local development

### 1. Backend

```bash
cd server
cp .env.example .env
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Default API: `http://localhost:4000/api/v1`

Useful probes:

```text
GET /health
GET /health/ready
GET /health/database
GET /api/v1
```

### 2. Blockchain gateway

For a fully blockchain-enabled local environment:

```bash
cd blockchain
cp .env.example .env
npm ci
npm run node
```

In another terminal, deploy the contract:

```bash
npm run deploy:localhost
```

Set the deployed `CONTRACT_ADDRESS`, issuer key, chain/RPC values, and `GATEWAY_API_KEY`, then start:

```bash
npm run gateway
```

Use the **same secret value** for `blockchain/.env:GATEWAY_API_KEY` and `server/.env:BLOCKCHAIN_GATEWAY_KEY`.

Then enable the backend integration:

```dotenv
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_GATEWAY_URL=http://127.0.0.1:4100
BLOCKCHAIN_GATEWAY_KEY=<same-shared-secret>
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Default UI: `http://localhost:5173`

```dotenv
VITE_API_URL=http://localhost:4000/api/v1
VITE_PUBLIC_APP_URL=http://localhost:5173
```

## Environment and secrets

Never commit real `.env` files. Important boundaries:

- `ISSUER_PRIVATE_KEY` belongs only in `blockchain/` runtime configuration.
- `GATEWAY_API_KEY` and `BLOCKCHAIN_GATEWAY_KEY` must match but should be long, random, and secret.
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `EMAIL_OTP_SECRET`, and `QR_TOKEN_SECRET` must be production-grade random values.
- browser variables are public by definition. Never put server or blockchain secrets in `VITE_*` variables.
- `TRUST_PROXY=true` is appropriate behind hosts such as Render; keep it false for ordinary local HTTP development.

See `server/documentation/ENVIRONMENT.md` and the three `.env.example` files.

## Testing and quality

Backend:

```bash
cd server
npm run env:check
npm run prisma:validate
npm run lint
npm test
```

Blockchain:

```bash
cd blockchain
npm test
npm run build
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Run the relevant suites before merging changes. Blockchain tests cover issuance/revocation, evidence and incident anchoring, access control, and idempotency. Backend tests are organized by implementation phases plus unit/integration/e2e/security suites.

## Deployment model

A typical production deployment uses three services plus PostgreSQL:

```text
Vercel/static host       Render/Node service        Render/Node service
frontend/  ────────────► server/  ────────────────► blockchain/
                              │                           │
                              ▼                           ▼
                         PostgreSQL                  public EVM RPC
```

The blockchain gateway should remain private-by-secret even if reachable on the public internet. Only `/health` is intentionally unauthenticated. All credential mutation/read endpoints require `x-kavach-chain-key`.

## Documentation map

| Area | Primary documentation |
|---|---|
| Whole system | `README.md`, `server/documentation/SYSTEM-FLOW.md` |
| Backend | `server/README.md`, `server/documentation/ARCHITECTURE.md` |
| REST API | `server/documentation/ENDPOINTS.md`, `server/openapi.yaml` |
| Database | `server/documentation/DATABASE-OVERVIEW.md`, `server/prisma/schema.prisma` |
| Environment | `server/documentation/ENVIRONMENT.md` |
| Realtime | `server/documentation/REALTIME-EVENTS.md` |
| Roles | `server/documentation/ROLE-PERMISSIONS.md` |
| Blockchain | `blockchain/README.md`, `server/documentation/BLOCKCHAIN-CATALOGUE.md` |
| Frontend | `frontend/README.md`, `frontend/docs/Architecture.md` |
| Deployment | `server/documentation/DEPLOYMENT.md`, `blockchain/docs/deployment.md` |
| AI/ML | `ai-ml/docs/plan.md`, `server/documentation/AI-CATALOGUE.md` |

## Documentation policy

Some files under `frontend/docs/` and `blockchain/docs/` began as implementation plans or team handoff notes. They are retained for design history, but they must not override the current source tree. When behavior changes, update the closest runtime-facing catalogue first, then the corresponding planning/design document.

## License

No license file is present in this repository snapshot. Add one before distributing the project under explicit open-source terms.

## Latest integrated safety and blockchain flow

The current build separates **detection**, **human escalation**, **responder dispatch**, and **tamper-evident trip records**:

- Danger-zone entry immediately notifies the tourist and Disaster Management by website/in-app channel and email. It does not automatically contact Police, Fire, or Ambulance/Hospital.
- A non-leader group member who stops sending trusted location updates for the configured threshold (default 5 minutes) opens a persisted signal-loss case. The leader receives a 5-minute `FALSE_ALARM` / `CONFIRMED_DANGER` decision window. No response or confirmed danger escalates to Disaster Management. While still offline, reminders recur every 5 minutes after a handled response.
- Disaster Management initiates responder dispatch. Police, Fire, and Ambulance/Hospital use the unified fleet account UI for Active Dispatch, Live Tracking, and Dispatch History. Assigned responders receive email plus realtime/app state.
- Responder GPS is visible to the affected tourist/group, Disaster Management, and the authorized responder side.
- Group QR codes contain a standard HTTPS join link and can be opened by ordinary QR scanners.
- Blockchain credentials retain the existing `idHash` and now also support encrypted append-only snapshots. Individual trip snapshots cover name, date of birth, destination, phone, and email. Group snapshots record group name, member count, destination, leader contact identity, and append a new snapshot when a member joins.
- During a planned/active trip, tourists cannot edit name, DOB, email, or phone. A periodic integrity worker compares PostgreSQL against the latest individual or group blockchain snapshot and restores protected fields/destination if database values differ.

Blockchain remains outside the emergency critical path: SOS, tracking, notifications, and dispatch continue even if blockchain anchoring is temporarily unavailable.


### Rakshak AI service

`ai-ml/` now contains a standalone TypeScript/Express chatbot service intended for a separate Render deployment. The frontend connects with `VITE_AI_SERVICE_URL`; the service performs lightweight knowledge-base retrieval and Groq inference.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


### Rakshak AI live context

Rakshak AI answers normal conversation even when no static knowledge-base file matches. For grounded Kavach facts it uses the Markdown knowledge base, while location-dependent features may use authenticated live backend data. In particular, **Nearest Safe Zone** forwards the user's access token to the main backend safety-zone endpoint and calculates the closest configured `SAFE` zone from the browser's current location. The AI service requires `KAVACH_API_URL` pointing to the main backend API base URL including `/api/v1`.

## August 2026 current architecture

The repository currently runs as multiple deployable services:

- `client/`: React/Vite browser application.
- `server/`: main Express/Prisma/PostgreSQL API, Socket.IO, safety jobs, notifications, trips, groups, incidents and dispatch.
- `blockchain/`: independent Ethereum Sepolia gateway plus `TrustAnchor.sol`.
- `ai-ml/`: independent Rakshak AI TypeScript/Express service with Groq, Markdown retrieval and persistent PostgreSQL chat history.

### Current safety flow

Danger-zone detection notifies the affected tourist and Disaster Management immediately by application/realtime state and email. It does **not** automatically dispatch Police, Fire or Ambulance/Hospital. Disaster Management decides when to initiate a responder dispatch.

For an active group trip, a non-leader member that stops sending trusted location updates for the configured threshold (default five minutes) creates a signal-loss case. The leader receives `FALSE_ALARM` and `CONFIRMED_DANGER` actions with a five-minute response window. Confirmation or timeout escalates into the incident path. After either leader action, if the member remains offline, another leader app/email reminder and fresh five-minute decision window are created after five minutes.

### Blockchain integrity

Individual and group credentials are issued to `TrustAnchor.sol` using a SHA-256 `idHash`. The contract also keeps append-only encrypted `DataSnapshot` records. The API integrity worker runs every five seconds and publishes realtime states such as `CHECKING`, `VERIFIED`, `DB_TAMPERED`, `FIXING`, `FIXED` and `INTEGRITY_UNAVAILABLE`.

See `blockchain/docs/data-storage-and-integrity.md` for the exact hashed/encrypted fields and recovery model.

## 2026-08-27 implementation sync

The repository documentation is synchronized with the current integrated KAVACH build as of **27 August 2026**.

### Current product surfaces

- **Tourist:** trip planning and lifecycle, live tracking, group journeys, SOS, manual safety reports, incident history, profile, evidence, notifications, and shared emergency-response tracking.
- **Disaster Management:** emergency command dashboard, live command map, incident queue, incident command record, fleet dispatch, risk zones, fleet account provisioning, response intelligence, notifications, and realtime operational updates.
- **System Admin:** enterprise-style platform overview, destination registry, risk-zone administration, account directory, audit trail, and diagnostics.
- **Police / Ambulance / Fire fleets:** service-specific responder portals with blue / green / red accents, active dispatch progression, live GPS transmission, fixed registered fleet-base marker, black road routing to the incident, and structured dispatch history.
- **Rakshak AI:** authenticated chat history, live safe-zone context, static KAVACH knowledge-base retrieval, and private authenticated-user context scoped to the current user only.

### Current incident lifecycle rules

An incident is operational only while its owning trip remains active where a trip relationship exists. Completing or cancelling a trip expires or closes trip-derived active alerts, signal-loss cases, incidents, and active dispatch state so stale records do not remain in active Tourist, Disaster Management, or System Admin views.

Group-member signal loss uses a leader-verification workflow: the leader receives the initial verification request, a confirmed danger or no response after five minutes escalates to Disaster Management, and a false alarm is rechecked later instead of immediately creating an operational incident.

### Current responder-map rules

The responder live map distinguishes three concepts:

- **blue reference dot:** the fixed location configured for the fleet account;
- **service-coloured live unit:** Police blue, Ambulance green, Fire red;
- **red incident/tourist marker:** emergency destination;
- **black route:** Google driving route from the responder's current live position to the emergency destination once a dispatch is active.

Manual pan/zoom is preserved while GPS updates arrive. The map re-fits only when the operational context changes, such as selecting a different dispatch.

---

## Repository synchronization — 2026-08-27

This documentation snapshot has been synchronized with the current KAVACH repository. The implemented system now includes tourist, disaster-management, system-admin, police, fire, and ambulance workflows; persistent responder GPS tracking; road-aware emergency routing; group safety monitoring; danger-zone automation; user-scoped chatbot context; and email-OTP password recovery.

- Responder tracking runs from the persistent responder layout, so GPS transmission and dispatch polling continue while moving between Active Dispatch, Live Tracking, and Dispatch History.
- Tourist Live Map combines group-member tracking, danger zones, and active emergency-fleet response on one map. The leader remains red; subsequent members use distinct colors, with the second member purple.
- Fleet routes follow Google driving roads where routable, show travelled segments in grey, remaining road in blue, the live fleet in green, and a dotted connector from the closest routable road point to an off-road tourist/incident location.
- SOS creation requires a valid location. The client requests fresh high-accuracy GPS and the backend can fall back to the latest trusted trip location instead of silently storing `0,0`.
- Active trip/group danger-zone intersections can create safety alerts/incidents immediately; trip completion or cancellation expires trip-bound active alerts.
- Password reset uses an email OTP verification flow before accepting the new password.
- Database conflicts are returned as user-safe conflict messages instead of leaking Prisma/constraint wording.
