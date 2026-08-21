# Smart Tourist Safety System — Backend

Phase 0 provides the production-shaped foundation for the SIH prototype. It is a Node.js
ESM service built with Express, PostgreSQL, Prisma, Socket.IO, Pino, Jest, and Supertest.

This phase intentionally contains no authentication or tourist/disaster-management/admin
business flows yet. AI and blockchain also remain separate services and are not part of
this backend.

## What Phase 0 includes

- Validated environment configuration with clear fail-fast startup errors
- PostgreSQL connection lifecycle through Prisma 7 and `@prisma/adapter-pg`
- Express app separated from the HTTP server for easy testing
- Helmet, explicit CORS allow-listing, request size limits, rate limiting, and request IDs
- Structured JSON application and request logging with secret redaction
- Standard success/error envelopes plus centralized 404 and error handling
- Liveness, readiness, and database health probes
- Socket.IO server bootstrap with no sensitive business events enabled yet
- Graceful shutdown for HTTP, Socket.IO, and PostgreSQL
- Jest/Supertest Phase 0 tests, ESLint, Docker, and local PostgreSQL Compose files

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- PostgreSQL 15+ (or Docker Desktop)

## First run (PowerShell)

```powershell
Copy-Item .env.example .env
npm install
npm run prisma:generate
npm run prisma:validate
npm test
npm run dev
```

## First run (bash)

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:validate
npm test
npm run dev
```

The API listens at `http://localhost:4000` by default. A database must be reachable before
the server starts. To start the provided local database:

```bash
docker compose up -d postgres
```

## Health endpoints

| Endpoint               | Purpose                                     | Healthy status |
| ---------------------- | ------------------------------------------- | -------------- |
| `GET /health`          | Process liveness; does not touch PostgreSQL | `200`          |
| `GET /health/ready`    | Whether required dependencies are ready     | `200` or `503` |
| `GET /health/database` | Direct PostgreSQL probe and latency         | `200` or `503` |
| `GET /api/v1/health/*` | API-prefixed aliases of the same probes     | Same as above  |

All JSON responses include `success`, `requestId`, and `timestamp`. Send an
`X-Request-ID` header to correlate frontend and backend logs; unsafe values are replaced.

## Useful commands

| Command                      | What it does                                        |
| ---------------------------- | --------------------------------------------------- |
| `npm run env:check`          | Validates configuration without starting the server |
| `npm run env:check:database` | Also opens and probes PostgreSQL                    |
| `npm run dev`                | Starts with automatic reload                        |
| `npm start`                  | Starts normally                                     |
| `npm test`                   | Runs the Phase 0 test suite                         |
| `npm run test:coverage`      | Runs tests and enforces coverage thresholds         |
| `npm run lint`               | Checks JavaScript quality rules                     |
| `npm run format:check`       | Checks Prettier formatting                          |
| `npm run prisma:generate`    | Generates Prisma Client                             |
| `npm run prisma:validate`    | Validates Prisma configuration/schema               |

## Environment safety

Commit example files only. Never commit `.env`, database credentials, tokens, service
accounts, private keys, or uploaded evidence. In production, use explicit HTTPS origins;
wildcard CORS is rejected when credentials are enabled and is always rejected in production.

## Phase 1 - Tourist authentication and onboarding

Phase 1 adds the permanent tourist account and onboarding/profile foundation required before trips, groups, tracking, SOS, and incidents. Tourist profile fields are stored directly on `users`; privileged staff accounts are stored separately in `disaster_managers` and `system_admins`.

### Implemented API

- `POST /api/v1/auth/register` - tourist signup with name, username, email, phone, password, and confirm password.
- `POST /api/v1/auth/login` - sign in using username or email plus password.
- `POST /api/v1/auth/refresh` - rotate the refresh token and return a new access token.
- `POST /api/v1/auth/logout` - revoke the current refresh session.
- `GET /api/v1/auth/me` - return the authenticated permanent account.
- `POST /api/v1/tourists/me/onboarding` - save gender, age, medical history, emergency phone, and nationality.
- `GET /api/v1/tourists/me` - return the tourist profile used by the Profile screen.
- `PATCH /api/v1/tourists/me` - update supported profile fields.

Access tokens expire after 15 minutes. Refresh tokens expire after 15 days, are rotated on refresh, stored only as SHA-256 hashes in PostgreSQL, and are also issued as HttpOnly cookies. Passwords use Argon2id. Tourist self-registration cannot create privileged staff accounts.

### Database migration

After setting `DATABASE_URL` and `DIRECT_URL` for Neon:

```powershell
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate
```

For a deployed environment, apply already-created migrations with:

```powershell
npm run prisma:migrate:deploy
```

### Optional staff seed accounts

`SYSTEM_ADMIN` and `DISASTER_MANAGER` are authenticated from their own database tables, separate from tourist `users`. Set the optional `SEED_ADMIN_*` and `SEED_DM_*` variables in `.env`, then run `npm run prisma:seed`. If email/password values are left blank, that staff account is not created.

### Not part of Phase 1

Tourist dashboard live location, nearby safe zones, risk scoring, SOS/incident workflow, trip history, trip creation, group QR join/create, tracking, chatbot, and responder dispatch remain later phases. Their module placeholders stay untouched so Phase 1 does not pretend the emergency system exists before its foundations do.

## Phase 4: Trips, Safety ID and Consent

Phase 4 adds the backend-owned trip lifecycle only. AI/ML, blockchain anchoring, and QR generation remain separate team-owned integrations and are intentionally not implemented here.

Tourist endpoints:

- `POST /api/v1/trips` — create one `PLANNED` solo/group trip.
- `GET /api/v1/trips/current` — fetch the current `PLANNED` or `ACTIVE` trip.
- `GET /api/v1/trips/history` — paginated completed/cancelled history.
- `GET /api/v1/trips/:tripId` — fetch an owned trip.
- `POST /api/v1/trips/:tripId/consents` — grant `LOCATION_TRACKING` or `EMERGENCY_SHARING` consent.
- `DELETE /api/v1/trips/:tripId/consents/:consentId` — withdraw consent.
- `POST /api/v1/trips/:tripId/safety-id` — issue/reissue an opaque trip-scoped Safety ID after both consents are granted.
- `POST /api/v1/trips/:tripId/start` — start after consent + active Safety ID checks.
- `POST /api/v1/trips/:tripId/complete` — complete and revoke temporary sharing/ID access.
- `POST /api/v1/trips/:tripId/cancel` — cancel a planned/active trip and revoke temporary access.

### Partner integration boundary

The core backend stores the authoritative `Trip`, `TripSafetyId`, and `TripConsent` records. It does **not** generate a QR, call a blockchain contract, hash/anchor the Safety ID, run AI scoring, or implement `/assess`. Those partner-owned services should consume these backend records through later integration adapters without changing the Phase 4 lifecycle.

The agreed AI contract remains a later backend integration around `POST /trips/:id/safety-assessments` -> AI service `POST /assess`. The blockchain team owns Safety ID proof issuance/revocation/verification and consent anchoring. No raw PII, medical data, or GPS is added to any blockchain payload by this phase.

## Phase 5 - Group management

Phase 5 adds backend-owned group membership for `GROUP` trips: group creation, leader/member authorization, expiring invitation tokens, join/leave/remove-member flows, and automatic group closure when a trip ends. The backend deliberately does not generate QR images; clients or the separately owned QR component can encode the returned `inviteToken`.

Routes are under `/api/v1/groups`. Invitation tokens are returned only when created; only SHA-256 token hashes are persisted.

## Phase 8 - Alerts, SOS, and Incident Response

Phase 8 turns Phase 7 deterministic safety alerts into operational incidents and adds a manual SOS path.

### Tourist endpoints

- `GET /api/v1/alerts` - list own Phase 7 safety alerts.
- `GET /api/v1/alerts/:alertId` - read an own safety alert.
- `POST /api/v1/alerts/:alertId/acknowledge` - acknowledge an own alert.
- `POST /api/v1/alerts/:alertId/resolve` - resolve an own alert.
- `POST /api/v1/sos` - create a CRITICAL SOS incident for an active trip.
- `GET /api/v1/sos/:sosId` - read an SOS when authorized.
- `GET /api/v1/incidents/mine` - list own and active-group incidents.
- `GET /api/v1/incidents/:incidentId` - read an authorized incident and its lifecycle events.

### Disaster Management / System Admin endpoints

- `GET /api/v1/incidents/queue` - active emergency queue.
- `POST /api/v1/incidents/:incidentId/acknowledge`
- `POST /api/v1/incidents/:incidentId/start`
- `POST /api/v1/incidents/:incidentId/resolve`
- `POST /api/v1/incidents/:incidentId/dismiss`
- Equivalent operational routes are also exposed under `/api/v1/disaster-management/incidents`.

### Lifecycle

`OPEN -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED`

False positives can be moved to `DISMISSED` by Disaster Management or a System Admin. Every operational transition writes an immutable `IncidentEvent`, while major actions also write to the existing audit log.

### Phase 7 integration

When Phase 7 creates or reuses an active `SafetyAlert`, Phase 8 idempotently creates the matching incident using `sourceSafetyAlertId` as the unique key. Manual SOS incidents are always `CRITICAL` and use an explicitly supplied coordinate pair or the tourist's latest trusted location.

### Migration

Apply the new forward migration after pulling Phase 8:

```powershell
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:deploy
```

The Phase 8 migration also repairs the missing Phase 6 tracking DDL found in the uploaded migration history using guarded `IF NOT EXISTS`/duplicate-object handling.

## Phase 9 - Notifications and Response Coordination
Phase 9 adds idempotent in-app incident notifications, unread/read APIs, disaster-manager assignment history, response notes, and configurable overdue incident escalation. Configure `INCIDENT_ACK_TIMEOUT_MINUTES` and `INCIDENT_ESCALATION_INTERVAL_MINUTES`. A system admin can trigger the scheduler-ready sweep with `POST /api/v1/escalations/run`. Run `npm run test:phase9` for the dedicated suite.

## Phase 10 - Realtime coordination

Phase 10 extends the existing Socket.IO tracking channel into an authenticated realtime coordination layer. Authenticated accounts automatically join account and role scoped rooms. Tourists may subscribe only to incidents they can already view through the REST API; disaster managers and system administrators may subscribe to emergency incidents.

Server events include `system:ready`, `location:updated`, `incident:created`, `incident:updated`, `incident:note`, `notification:created`, `notification:read`, and `notification:read-all`. Client subscription commands include `tracking:subscribe`, `tracking:unsubscribe`, `incident:subscribe`, `incident:unsubscribe`, and `group:unsubscribe`.

Use `npm run test:phase10` for the realtime-specific test suite.


## Phase 11 - Disaster Management and Responder Operations

Phase 11 completes the responder-facing backend. Disaster managers now expose operational availability, workload and organization metadata without introducing Phase 15 dispatch-unit concepts.

Responder endpoints under `/api/v1/disaster-management`:

- `GET /dashboard` - active/critical/unassigned incident counts, personal workload, resolved-today count and available responder count.
- `GET /responders` - filtered active responder directory with computed workload/capacity.
- `GET /responders/me` - authenticated disaster-manager profile plus active workload.
- `PATCH /responders/me/status` - set `AVAILABLE`, `BUSY`, or `OFF_DUTY`; audited and published over Socket.IO as `responder:status`.
- `GET /responders/me/incidents` - incidents assigned to the authenticated responder.
- `GET /responders/:responderId` - responder details and current workload.
- `GET /incidents?scope=ALL|UNASSIGNED|MINE` - workload-aware emergency queue.

Incident assignment now rejects off-duty/busy responders and responders who reached `maxActiveIncidents`. The database migration adds `ResponderStatus`, `department`, `maxActiveIncidents`, and status-change metadata to `disaster_managers`.

Run `npm run test:phase11` for the dedicated Phase 11 suite.


## Phase 12 - Hazard Reporting and Management

Phase 12 adds tourist hazard reporting, staff verification/rejection/resolution, verified nearby hazard discovery, audit records, and real-time `hazard:created` / `hazard:updated` events. Tourist public listings expose verified hazards only; reporters can still inspect their own pending reports.

Main endpoints: `POST /api/v1/hazards`, `GET /api/v1/hazards`, `GET /api/v1/hazards/nearby`, `GET /api/v1/hazards/:hazardId`, and staff moderation endpoints under `/:hazardId/{verify,reject,resolve}`.
