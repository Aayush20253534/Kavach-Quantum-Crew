# Backend Architecture

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
