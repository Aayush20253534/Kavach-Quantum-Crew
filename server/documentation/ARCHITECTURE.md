# Backend Architecture

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Design

The backend is a modular Express service. Each active domain generally follows:

```text
routes -> middleware -> controller -> service -> repository -> Prisma -> PostgreSQL
```

The service layer owns business rules. Controllers translate HTTP requests/responses. Repositories isolate persistence. Zod schemas validate external input before it reaches domain logic.

## Cross-cutting layers

```text
Incoming HTTP request
   |
   +-- request ID
   +-- structured HTTP logging
   +-- Helmet / CORS
   +-- privacy headers
   +-- body size limits
   +-- request-shape security
   +-- rate limiting
   |
   v
API router
   |
   +-- authentication
   +-- role authorization
   +-- Zod validation
   |
   v
Domain module
```

Errors pass through centralized normalization so unexpected implementation details are not returned to clients.

## Authentication and verification boundary

```text
Tourist register
  -> create account with emailVerifiedAt = null
  -> cryptographically generate 6-digit OTP
  -> persist keyed OTP hash + expiry/attempt state
  -> send OTP with Gmail SMTP
  -> verify-email
  -> mark emailVerifiedAt
  -> issue access/refresh session
```

Unverified tourists cannot use normal login sessions, refresh sessions, protected REST routes, or authenticated Socket.IO. Changing the tourist email clears `emailVerifiedAt` and revokes refresh sessions so the new address must be verified.

## Major domain flow

```text
Account + verified email
  -> Trip
      -> Consent + Safety ID
      -> Group membership
      -> Location tracking
          -> Safety / geofence / monitoring evaluation
              -> SafetyAlert
                  -> Incident
                      -> Notifications / escalation
                      -> Responder assignment
                      -> Dispatch
                      -> Communication
                      -> Evidence
                      -> Resolution
```

## Realtime architecture

```text
Domain service
   -> realtimePublisher
      -> account room / role room / incident room
         -> authorized Socket.IO clients
```

Tracking and incident subscription gateways separately authorize room subscriptions.

## External providers

Three areas deliberately use adapter/provider boundaries:
1. AI: risk assessment and hazard analysis.
2. Blockchain: Safety ID, incident, and evidence proof anchoring/verification.
3. Notification delivery: EMAIL, SMS, PUSH, WHATSAPP.

## Persistence

PostgreSQL is authoritative for accounts, email-verification OTP state, trips, consent, tracking state, safety/incident state, dispatch, evidence metadata, notifications, audit records, and delivery history. Evidence bytes remain behind the object-storage adapter rather than inside PostgreSQL.

## Security boundaries

Authorization is layered:
- route role guards where possible,
- ownership/membership checks inside services,
- explicit consent checks for tracking,
- visibility checks for incidents/hazards/evidence,
- admin-only audit/observability,
- path-safe evidence storage,
- JWT/session validation,
- mandatory tourist email verification before session use,
- keyed OTP hashing, expiry, cooldown, and attempt limits,
- global and sensitive-action rate limits.

Never infer access from a resource UUID alone.

## Emergency service dispatch extension

Emergency response uses the existing Incident -> Dispatch -> EmergencyUnit architecture. Police, Fire, and Ambulance accounts authenticate through the shared auth/session layer, own emergency units, update their live coordinates, and receive dispatch events. Nearest-unit selection is performed inside the dispatch service using incident and unit coordinates; realtime updates reuse Socket.IO incident/account rooms. See `EMERGENCY-SERVICE-DISPATCH.md`.

## Latest safety orchestration and blockchain integrity

`signal-loss` is a dedicated persisted domain rather than an immediate generic tracking-interruption incident for group members. Its scheduled sweep owns the 5-minute decision deadline and 5-minute reminders after a handled response, avoiding duplicate/racing escalation paths. `dispatch` remains a separate Disaster-Management-controlled domain; `/auto/:serviceType` performs nearest-unit assignment only after that action is initiated.

Blockchain is also split into credential state and append-only data snapshots. `ISSUE`/`EXTEND`/`REVOKE` update credential trust state, while `SNAPSHOT` jobs append encrypted individual/group payloads. Snapshot failure does not mark the underlying QR credential as failed. A separate integrity job verifies/decrypts the latest individual or group snapshot and repairs protected PostgreSQL values when required.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## 2026-08-27 architecture sync

The operational architecture now explicitly distinguishes **fixed fleet identity/location** from **live dispatch telemetry**. `EmergencyServiceAccount` owns the configured service/base coordinates; active dispatch tracking owns moving responder GPS. Disaster Management and Tourist shared-response views consume the latter during an active response.

Trip lifecycle cleanup is cross-module behavior: trip end reconciles monitoring alerts, signal-loss cases, incidents, and dispatches so active operational projections cannot outlive the trip that created them.
