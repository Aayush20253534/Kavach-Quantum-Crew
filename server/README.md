# Smart Tourist Safety System — Backend

Backend service for a tourist-safety platform that manages tourist accounts, trips, consent, Safety IDs, group travel, trusted location tracking, deterministic safety monitoring, SOS incidents, disaster-management response, emergency dispatch, evidence, notifications, analytics, administration, external AI/blockchain contracts, audit trails, and operational observability.

The service is designed as a **modular Node.js backend**. AI models, blockchain clients/contracts, frontend applications, and concrete external notification vendors are separate integrations behind explicit backend boundaries.

## What the backend does

### Tourist safety
- Tourist registration, login, refresh sessions, logout, and profile onboarding
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
- AI and blockchain integration contracts
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
npm ci
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:deploy
npm run dev
```

bash:

```bash
cp .env.example .env
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

The backend uses short-lived access JWTs and persisted refresh sessions.

- Access tokens are signed with `HS256`, issuer/audience validation, and supported-role validation.
- Passwords are hashed with Argon2id.
- Refresh tokens are rotated and only token hashes are persisted.
- Tourist self-registration cannot create staff accounts.
- Suspended/disabled accounts lose active refresh sessions through admin controls.

## API and realtime

- REST base: `/api/v1`
- OpenAPI source: [`openapi.yaml`](openapi.yaml)
- Full endpoint catalogue: [`documentation/ENDPOINTS.md`](documentation/ENDPOINTS.md)
- Socket.IO events and rooms: [`documentation/REALTIME-EVENTS.md`](documentation/REALTIME-EVENTS.md)

## Health and operations

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
The backend defines validated contracts for trip/location risk assessment and hazard analysis. No inference model is implemented here. See [`documentation/AI-CATALOGUE.md`](documentation/AI-CATALOGUE.md).

### Blockchain
The backend defines contracts for Safety ID proof, incident proof, evidence proof, and proof verification. No wallet, smart contract, private-key handling, chain SDK, or transaction implementation is included. See [`documentation/BLOCKCHAIN-CATALOGUE.md`](documentation/BLOCKCHAIN-CATALOGUE.md).

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
| [`ARCHITECTURE.md`](documentation/ARCHITECTURE.md) | Finished backend architecture and major boundaries |
| [`ENDPOINTS.md`](documentation/ENDPOINTS.md) | All mounted HTTP API routes |
| [`SYSTEM-FLOW.md`](documentation/SYSTEM-FLOW.md) | End-to-end system explanation for non-specialists |
| [`ROLE-PERMISSIONS.md`](documentation/ROLE-PERMISSIONS.md) | Role and authorization matrix |
| [`DATABASE-OVERVIEW.md`](documentation/DATABASE-OVERVIEW.md) | Main data entities and relationships |
| [`REALTIME-EVENTS.md`](documentation/REALTIME-EVENTS.md) | Socket.IO rooms, commands, and server events |
| [`ERROR-CATALOGUE.md`](documentation/ERROR-CATALOGUE.md) | Error envelope and important error codes |
| [`ENVIRONMENT.md`](documentation/ENVIRONMENT.md) | Environment-variable reference |
| [`AI-CATALOGUE.md`](documentation/AI-CATALOGUE.md) | AI integration inputs and handoff guidance |
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

New tourist accounts must verify their email before normal login/session use. Registration creates a six-digit OTP in backend code, stores only its keyed hash, and sends the code through Gmail SMTP using Nodemailer. Verification is completed through `POST /api/v1/auth/verify-email`; a replacement code can be requested through `POST /api/v1/auth/resend-verification`.

For local/deployed Gmail delivery, enable Google 2-Step Verification, generate an App Password, and configure `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM`, and `EMAIL_OTP_SECRET`. See `documentation/ENVIRONMENT.md`.
