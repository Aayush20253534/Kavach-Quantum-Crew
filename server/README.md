# Smart Tourist Safety System — Backend

> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


Backend service for a tourist-safety platform that manages tourist accounts, trips, consent, Safety IDs, group travel, trusted location tracking, deterministic safety monitoring, SOS incidents, disaster-management response, emergency dispatch, evidence, notifications, analytics, administration, external AI/blockchain contracts, audit trails, and operational observability.

The service is designed as a **modular Node.js backend**. AI models, blockchain clients/contracts, frontend applications, and concrete external notification vendors are separate integrations behind explicit backend boundaries.

## What the backend does

### Tourist safety
- Tourist registration with six-digit Gmail OTP email verification, login, refresh sessions, logout, and profile onboarding
- SOLO and GROUP trip lifecycle management
- Explicit location/emergency-sharing consent
- Trip-scoped Safety ID issuance
- Group invitations and membership
- Trusted location ingestion and group tracking
- Scheduled safety check-ins
- Circular and polygon geofencing
- Risk-zone evaluation
- Tracking-interruption, inactivity, overtime, route-deviation, and group-separation monitoring
- Safety alerts and manual SOS

### Emergency response
- Incident creation from safety alerts and SOS
- Incident acknowledgement, response start, resolution, dismissal, notes, and assignments
- Disaster-manager availability/capacity
- Emergency-unit inventory and dispatch lifecycle
- Incident-scoped tourist/staff communication
- Hazard reporting, verification, rejection, resolution, and nearby discovery
- Evidence upload/download with authorization and SHA-256 checksums

### Platform operations
- In-app notifications
- Provider-neutral EMAIL/SMS/PUSH/WHATSAPP delivery jobs with retry history
- Escalation sweep for overdue incidents
- Realtime Socket.IO events
- Staff analytics and response-time reporting
- System-admin account/resource management
- AI and blockchain integration contracts (staff-only AI risk/hazard contracts; no tourist chatbot API yet)
- Central audit querying
- HTTP metrics and safe runtime/database diagnostics
- Security hardening, rate limiting, privacy headers, request-shape protection, and JWT validation

## Roles

| Role | Primary responsibility |
|---|---|
| `TOURIST` | Own profile/trips, share consented location, receive safety alerts, trigger SOS, communicate during incidents, report hazards, upload authorized evidence |
| `DISASTER_MANAGER` | Monitor incidents, coordinate response, manage hazards/risk zones, self-assign within capacity, dispatch units, review analytics |
| `SYSTEM_ADMIN` | Platform administration, privileged response operations, account controls, delivery queue processing, audit access, observability |

See [`documentation/ROLE-PERMISSIONS.md`](documentation/ROLE-PERMISSIONS.md) for the full matrix.

## Technology stack

- Node.js 20.19+
- Express 5
- PostgreSQL
- Prisma 7 with `@prisma/adapter-pg`
- Socket.IO 4
- Zod validation
- Argon2id password hashing
- JSON Web Tokens with refresh-session persistence
- Nodemailer + Gmail SMTP App Password for tourist email verification
- Pino structured logging
- Multer evidence upload boundary
- Jest + Supertest
- ESLint + Prettier

## Architecture

```text
Client
  -> Express route
  -> authentication / authorization
  -> request validation
  -> controller
  -> domain service
  -> repository
  -> Prisma
  -> PostgreSQL
```

Domain services publish realtime events through a centralized Socket.IO publisher when appropriate. External delivery, AI, and blockchain capabilities use provider/adaptor boundaries rather than embedding vendor logic into the domain layer.

See [`documentation/ARCHITECTURE.md`](documentation/ARCHITECTURE.md).

## Project structure

```text
server/
├── prisma/
├── scripts/
├── src/
│   ├── common/
│   ├── config/
│   ├── constants/
│   ├── middleware/
│   ├── modules/
│   ├── observability/
│   ├── realtime/
│   ├── routes/
│   ├── app.js
│   └── server.js
├── storage/
├── tests/
├── documentation/
├── openapi.yaml
├── package.json
└── README.md
```

## Prerequisites

- Node.js `>=20.19.0`
- npm `>=10`
- PostgreSQL/Neon database
- Valid environment configuration

## Local setup

PowerShell:

```powershell
Copy-Item .env.example .env
# Configure Gmail App Password + EMAIL_OTP_SECRET in .env
npm ci
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:deploy
npm run dev
```

bash:

```bash
cp .env.example .env
# Configure Gmail App Password + EMAIL_OTP_SECRET in .env
npm ci
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:deploy
npm run dev
```

Default API URL:

```text
http://localhost:4000/api/v1
```

## Authentication

The backend uses short-lived access JWTs, persisted refresh sessions, and mandatory first-time tourist email verification.

Tourist signup flow:

```text
register -> generate 6-digit OTP -> Gmail SMTP -> verify-email -> issue session
```

- Registration creates the tourist but does **not** issue a normal login session until the email is verified.
- OTPs are generated with Node.js cryptographic randomness and stored only as keyed hashes.
- Default OTP expiry is 10 minutes, resend cooldown is 60 seconds, and maximum verification attempts is 5.
- Verified tourists use normal username/email + password login afterward; OTP is **not** required on every login.
- Changing a tourist email resets verification and requires the new address to be verified.
- Access tokens are signed with `HS256`, issuer/audience validation, and supported-role validation.
- Passwords are hashed with Argon2id.
- Refresh tokens are rotated and only token hashes are persisted.
- Tourist self-registration cannot create staff accounts.
- Suspended/disabled accounts lose active refresh sessions through admin controls.
- Unverified tourists are rejected by normal REST authentication, refresh, and Socket.IO authentication.

## API and realtime

- REST base: `/api/v1`
- OpenAPI source: [`openapi.yaml`](openapi.yaml)
- Full endpoint catalogue: [`documentation/ENDPOINTS.md`](documentation/ENDPOINTS.md)
- Socket.IO events and rooms: [`documentation/REALTIME-EVENTS.md`](documentation/REALTIME-EVENTS.md)

## Health and operations

Service landing page:
- `GET /`

Infrastructure probes:
- `GET /health`
- `GET /health/ready`
- `GET /health/database`

System-admin observability:
- `GET /api/v1/observability/metrics`
- `GET /api/v1/observability/diagnostics`
- `GET /api/v1/audit`
- `GET /api/v1/audit/summary`

## External integration boundaries

### AI
The backend defines validated, **staff-only** contracts for trip/location risk assessment and hazard analysis:

- `GET /api/v1/integrations/capabilities`
- `POST /api/v1/integrations/ai/risk-assessment`
- `POST /api/v1/integrations/ai/hazard-analysis`

No inference model is implemented by default, so the AI POST routes return `501 INTEGRATION_PROVIDER_NOT_CONFIGURED` until a provider is injected.

The tourist conversational boundary is implemented at `POST /api/v1/chatbot/messages` and is restricted to authenticated tourist accounts. Its default provider still needs a real AI implementation, and the frontend widget may remain simulated until it is wired to this route. The staff-only `/integrations/ai/*` routes are separate analysis contracts. See [`documentation/AI-CATALOGUE.md`](documentation/AI-CATALOGUE.md).

### Blockchain
The backend has a live asynchronous blockchain path for individual/group trip credentials: it hashes credential identities, queues `ISSUE`/`EXTEND`/`REVOKE` jobs, calls the isolated blockchain gateway, and verifies confirmed credentials on-chain. The issuer private key and ethers/contract runtime remain isolated in `blockchain/gateway/`. Separate integration-contract endpoints for Safety ID, incident, and evidence proofs also exist. See [`documentation/BLOCKCHAIN-CATALOGUE.md`](documentation/BLOCKCHAIN-CATALOGUE.md) and [`../blockchain/docs/workflow.md`](../blockchain/docs/workflow.md).

### Notification providers
`IN_APP` delivery is internal. `EMAIL`, `SMS`, `PUSH`, and `WHATSAPP` are provider-neutral delivery channels. See [`documentation/NOTIFICATION-DELIVERY.md`](documentation/NOTIFICATION-DELIVERY.md).

## Security characteristics

The backend includes:
- explicit CORS allow-listing
- Helmet headers
- API privacy/no-cache headers
- global and sensitive-route rate limiting
- request-body limits
- request object-depth/key-count limits
- forbidden prototype-pollution keys
- role and ownership authorization
- evidence path traversal protections
- safe centralized error normalization
- request IDs for correlation
- secret redaction in structured logs

## Testing and quality

```powershell
npm test
npm run lint
npm run format:check
npm run prisma:generate
npm run prisma:validate
npx prisma migrate status
```

Dedicated domain suites remain available for targeted debugging, but `npm test` is the final regression command.

## Documentation index

| Document | Purpose |
|---|---|
| [`TECHNICAL-FLOW.md`](documentation/TECHNICAL-FLOW.md) | Start here: request lifecycle, modules, dependencies, terminology, database, realtime, jobs, caching, integrations, and security for JavaScript developers |
| [`ARCHITECTURE.md`](documentation/ARCHITECTURE.md) | Finished backend architecture and major boundaries |
| [`ENDPOINTS.md`](documentation/ENDPOINTS.md) | All mounted HTTP API routes |
| [`SYSTEM-FLOW.md`](documentation/SYSTEM-FLOW.md) | End-to-end system explanation for non-specialists |
| [`ROLE-PERMISSIONS.md`](documentation/ROLE-PERMISSIONS.md) | Role and authorization matrix |
| [`DATABASE-OVERVIEW.md`](documentation/DATABASE-OVERVIEW.md) | Main data entities and relationships |
| [`REALTIME-EVENTS.md`](documentation/REALTIME-EVENTS.md) | Socket.IO rooms, commands, and server events |
| [`ERROR-CATALOGUE.md`](documentation/ERROR-CATALOGUE.md) | Error envelope and important error codes |
| [`ENVIRONMENT.md`](documentation/ENVIRONMENT.md) | Environment-variable reference |
| [`EMAIL-VERIFICATION.md`](documentation/EMAIL-VERIFICATION.md) | Gmail SMTP OTP signup verification flow and Postman testing |
| [`AI-CATALOGUE.md`](documentation/AI-CATALOGUE.md) | Mounted AI analysis endpoints, validation, provider status, and handoff guidance |
| [`BLOCKCHAIN-CATALOGUE.md`](documentation/BLOCKCHAIN-CATALOGUE.md) | Blockchain proof boundaries |
| [`NOTIFICATION-DELIVERY.md`](documentation/NOTIFICATION-DELIVERY.md) | Delivery jobs/providers/retries |
| [`TESTING.md`](documentation/TESTING.md) | Test strategy and commands |
| [`DEPLOYMENT.md`](documentation/DEPLOYMENT.md) | Deployment/readiness checklist |
| [`INTEGRATION-HANDOFF.md`](documentation/INTEGRATION-HANDOFF.md) | Frontend/AI/blockchain/provider handoff |
| [`FINAL-QA-CHECKLIST.md`](documentation/FINAL-QA-CHECKLIST.md) | Final backend acceptance checklist |

## Scope boundary

This repository owns the **backend API, persistence, security rules, deterministic safety logic, realtime server, and integration contracts**.

It intentionally does not own:
- frontend implementation
- AI model training/inference implementation
- blockchain smart-contract/wallet implementation
- deployment of external notification vendors
- client-device GPS acquisition

Those systems connect through the documented API, Socket.IO, and provider interfaces.

## Tourist email verification

Tourist email verification is mandatory on first signup and whenever the tourist changes to a new email address. It is not required on every login. Gmail SMTP uses a Google App Password, while the OTP itself is generated and verified entirely by backend code.

See [`documentation/EMAIL-VERIFICATION.md`](documentation/EMAIL-VERIFICATION.md) for configuration, security behavior, API examples, and Postman verification steps.


## Upstash Redis caching

Redis is optional and fail-open: if it is unavailable, reads fall back to PostgreSQL.

```env
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
REDIS_KEY_PREFIX=sts
REDIS_DASHBOARD_TTL_SECONDS=30
REDIS_DESTINATIONS_TTL_SECONDS=900
REDIS_RISK_ZONES_TTL_SECONDS=30
```

The first cache targets are total tourist count, active risk zones, and destination lists.
Authentication, OTP, SOS/incident writes, and live-location writes remain uncached. Keep
the Upstash token server-side on Render; never expose it as a `VITE_` variable.

The integration uses Upstash's HTTPS REST API through Node's built-in `fetch`, so it adds
no Redis npm dependency.

## Blockchain QR integration

For the full chain workflow, terminology, queue/retry model, gateway security boundary, and on-chain/off-chain data split, see [`../blockchain/docs/workflow.md`](../blockchain/docs/workflow.md).

The API now owns QR issuance and verification while delegating signing transactions to the isolated `blockchain/` gateway. This avoids importing TypeScript/Hardhat code into the Express runtime and, more importantly, keeps the issuer private key out of the general API process.

New runtime pieces:

- `src/modules/credential/` creates and verifies individual/group trip credentials.
- `src/integrations/blockchain/` hashes privacy-safe identifiers, talks to the gateway, and queues chain work.
- `src/jobs/blockchainAnchor.job.js` retries `ISSUE`, `EXTEND`, and `REVOKE` jobs without blocking ordinary trip/SOS requests.
- Prisma stores both credential state and the asynchronous blockchain job ledger.

Set `BLOCKCHAIN_ENABLED=true` only after the gateway is reachable and the contract has been deployed. When disabled, credentials still work as signed QR credentials but clearly report `blockchainStatus=DISABLED` rather than pretending verification succeeded.


### Render connection to blockchain gateway

The blockchain runtime is a separate Render Web Service. The API does not need `CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, `ISSUER_PRIVATE_KEY`, `address`, or `privateKey`. Configure only:

```env
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_GATEWAY_URL=https://<your-blockchain-service>.onrender.com
BLOCKCHAIN_GATEWAY_KEY=<same secret as blockchain GATEWAY_API_KEY>
BLOCKCHAIN_CONTRACT_VERSION=1
BLOCKCHAIN_WORKER_INTERVAL_MS=5000
BLOCKCHAIN_MAX_ATTEMPTS=5
QR_TOKEN_SECRET=<long independent random secret>
PUBLIC_APP_URL=https://<your-frontend-domain>
```

Keep `QR_TOKEN_SECRET` different from the gateway key. Human beings do occasionally reuse secrets everywhere, apparently as a hobby; don't do that here.

### Group QR join flow

Group leaders create an expiring invitation. The frontend renders that invitation as a QR payload in the form `KAVACH_JOIN:<opaque-token>`. Tourists scan it from the Join Trip page, call `POST /api/v1/groups/join/preview` to validate the invitation and review trip details, then call `POST /api/v1/groups/join` only after confirmation. The join endpoint still issues the tourist's individual blockchain-backed credential through the existing credential service.

### Group join by blockchain ID hash
`POST /api/v1/groups/join/qr/preview` and `POST /api/v1/groups/join/qr` accept `{ "groupIdHash": "0x..." }`. The hash must match an active group credential and a planned trip.

### Group QR leader approval

QR joining uses two-step membership approval. `POST /api/v1/groups/join/qr` no longer creates a `GroupMember` immediately; it creates or refreshes a `PENDING` `GroupJoinRequest`. The authenticated group leader reviews requests with `GET /api/v1/groups/:groupId/join-requests` and explicitly approves or rejects them. Only approval creates membership and issues the tourist's individual trip credential.

Requester status can be checked with `GET /api/v1/groups/join/requests/:requestId`. This keeps the blockchain group `idHash` useful as a compact scannable identifier without treating possession of the QR as authorization to enter the group.

## Police, Fire, and Ambulance dispatch

The backend now includes a unified emergency-service portal for Police, Fire, and Ambulance, nearest-available-unit auto assignment, service-side location/status updates, and tourist tracking. See `documentation/EMERGENCY-SERVICE-DISPATCH.md` for the complete backend contract. Docker startup applies committed Prisma migrations before launching the API.

### Emergency responder email flow

Police, Ambulance/Hospital, and Fire use a single-account-per-fleet model. The responder-facing product can stay focused on **Active Dispatch**, **Live Tracking**, and **Dispatch History**.

New SOS/incidents email active Disaster Managers with a protected deep link to the exact incident. Auto-assigned and manually assigned dispatches email the selected responder fleet with a protected deep link to the exact dispatch. Links use `PUBLIC_APP_URL` and `/login?redirect=...`; the frontend is responsible for preserving the redirect through authentication.

## Current safety escalation and blockchain integrity rules

- Danger-zone events notify the tourist and Disaster Management immediately through app/realtime state and email; they do not directly dispatch emergency fleets.
- Group-member signal loss uses a persisted case, a 5-minute leader decision window, Disaster Management escalation on confirmation/timeout, and 5-minute reminders after a handled response while offline.
- Police/Fire/Ambulance-Hospital dispatch happens after Disaster Management initiates assignment. The `/auto/:serviceType` endpoint automates nearest-unit **selection**, not the decision to dispatch.
- Emergency-service pages consume live backend state and publish responder browser GPS to dispatch tracking.
- Individual and group blockchain credentials now append AES-256-GCM encrypted snapshots while retaining their existing on-chain `idHash` credential record.
- `BLOCKCHAIN_DATA_ENCRYPTION_KEY` must be stable and at least 32 characters. Losing/changing it prevents recovery of older encrypted snapshots.
- `blockchainIntegrity.job.js` runs every 5 seconds and can restore protected individual-trip fields in PostgreSQL from the latest verified blockchain snapshot.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

## Current integrity worker and group support

`blockchainIntegrity.job.js` runs every five seconds. It reconciles both confirmed individual credentials and confirmed group credentials while their trips remain open.

Individual recovery compares the trusted decrypted snapshot with protected tourist identity/contact fields and destination. Group recovery validates the latest type-2 snapshot and compares recoverable group/leader/trip fields. Integrity state is pushed over Socket.IO to the affected tourist or active group members. A membership-count mismatch is detected but is not repaired by inventing/deleting membership rows; the service reports integrity unavailable for that unsafe automatic-repair case.

Snapshot jobs are separate from credential issuance jobs. A failed snapshot does not invalidate an otherwise confirmed QR credential.

## 2026-08-27 backend implementation sync

The current backend supports the full multi-role operational lifecycle: Tourist, Disaster Manager, System Admin, and emergency-service accounts (`POLICE`, `AMBULANCE`, `FIRE`).

Important current behavior:

- fixed emergency-service account locations are stored separately from live dispatch GPS;
- dispatch lifecycle is validated server-side and progresses through assigned/dispatch/en-route/on-scene/completed states;
- completing/cancelling a trip expires or closes trip-derived active safety state;
- signal-loss escalation gives the leader a verification window before authority escalation except when confirmed immediately;
- password reset uses email OTP verification before accepting a new password;
- realtime/notification/email integrations are side effects of operational state changes rather than mock frontend behavior.

---

## Repository synchronization — 2026-08-27

Backend synchronization highlights:

- Auth includes email verification plus password-reset request/OTP-verify/reset endpoints.
- Tracking is consent-gated and supports pings, latest trusted location, and group location feeds.
- SOS rejects invalid `0,0` coordinates and can fall back to the latest trusted trip location.
- Emergency services support provisioned police/fire/ambulance accounts, fixed base locations, responder dispatches, live location updates, status transitions, tourist dispatch listing, and shared tracking snapshots.
- Trip-bound safety alerts/incidents are expired when a trip is completed/cancelled.
- Unique-constraint failures are translated to a user-safe conflict response rather than exposing Prisma field/constraint wording.
