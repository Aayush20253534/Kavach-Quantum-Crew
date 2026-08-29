# KAVACH Complete System Flow

> **Current implementation reference — 29 August 2026.** This document describes the repository as it exists now: React/Vite client, Express/Prisma API, PostgreSQL, Upstash Redis caching, Socket.IO realtime, Mailjet transactional email, the Rakshak AI service, the FastAPI trip-planner service, Google Maps/Places integrations, and the isolated blockchain gateway. Runtime source and database migrations remain authoritative.

## 1. System at a glance

KAVACH is centered around a single trip lifecycle. Authentication, planning, group membership, live tracking, safety evaluation, incidents, emergency dispatch, notifications, AI, and blockchain proof all attach to that lifecycle rather than acting as unrelated subsystems.

```text
Tourist / Group member
        │
        ▼
React + Vite client
        │
        ├──────── REST /api/v1/* ───────────────┐
        │                                       │
        └──────── Socket.IO realtime ───────────┤
                                                ▼
                                   Express 5 main backend
                                                │
              ┌─────────────────────────────────┼───────────────────────────────┐
              │                                 │                               │
              ▼                                 ▼                               ▼
        PostgreSQL/Prisma                  Upstash Redis                   External services
        source of truth                    read cache                      │
                                                                           ├─ Mailjet
                                                                           ├─ Google Maps/Places
                                                                           ├─ Rakshak AI
                                                                           ├─ FastAPI trip planner
                                                                           └─ Blockchain gateway → EVM
```

The backend is the authority for user identity, role checks, trip status, group locks, tracking consent, incidents, dispatch assignments, and all persistent state. The browser never receives database credentials, Mailjet credentials, AI-provider secrets, blockchain signer keys, or server-side Google API secrets.

## 2. Account registration and authentication flow

### 2.1 Registration

```text
Tourist submits registration form
        │
        ▼
POST /api/v1/auth/register
        │
        ├─ validate body with Zod
        ├─ normalize/check username and email
        ├─ hash password with Argon2
        ├─ create unverified tourist account
        ├─ generate six-digit verification OTP
        ├─ hash/protect OTP state in database
        └─ Mailjet Send API v3.1 sends verification email
```

Registration does not treat successful email delivery as the source of truth. The account and OTP state are backend/database concepts; Mailjet is the transport.

### 2.2 Email verification

```text
POST /api/v1/auth/verify-email
        │
        ├─ locate active OTP
        ├─ enforce expiry
        ├─ enforce maximum attempts
        ├─ verify submitted code
        ├─ set emailVerifiedAt
        ├─ create refresh session
        └─ return access token + refresh cookie/session
```

A resend uses `POST /api/v1/auth/resend-verification`. It respects the configured cooldown, replaces the prior active verification code, and does not expose whether an arbitrary email exists in ways that would make account enumeration trivial.

### 2.3 Login and session refresh

```text
POST /api/v1/auth/login
  → credentials checked
  → role/account status checked
  → access JWT issued
  → refresh session persisted
  → refresh token returned as configured cookie

POST /api/v1/auth/refresh
  → refresh token validated
  → persisted session checked
  → access token rotated/returned

POST /api/v1/auth/logout
  → refresh session revoked
  → cookie cleared
```

Access JWTs protect REST and Socket.IO entry points. Backend authorization, not frontend route visibility, decides whether a role can perform an operation.

## 3. Tourist onboarding and profile flow

After first authentication the tourist can complete profile/onboarding through `/api/v1/tourists/me/*`. The backend owns profile data and accepts profile/medical uploads only through validated endpoints. Profile images use the configured Cloudinary integration; medical-document limits are controlled by environment values.

```text
GET  /api/v1/tourists/me
POST /api/v1/tourists/me/onboarding
PATCH /api/v1/tourists/me
POST /api/v1/tourists/me/profile-image
POST /api/v1/tourists/me/medical-document
```

## 4. Trip creation and the one-time planning decision

The current UI asks for destination, planned dates, and SOLO/GROUP once. The AI planner does **not** ask for the same destination/dates again.

### 4.1 Solo trip

```text
Trips → Create
   │
   ├─ destination
   ├─ planned start/end
   └─ SOLO
        │
        ▼
planning choice
   ├─ Plan without AI
   │      ├─ ensure required trip consents
   │      ├─ start the trip immediately
   │      └─ AI planning is permanently unavailable for that trip
   │
   └─ Plan with AI
          ├─ backend requests generated plan
          ├─ tourist reviews generated plan
          ├─ Save Plan & Start Trip
          ├─ aiPlan is attached while trip is PLANNED
          ├─ required consents are ensured
          └─ trip starts immediately
```

Once the trip status is no longer `PLANNED`, the backend refuses attempts to attach or replace an AI plan. This makes planning a true one-time decision instead of a frontend-only convention.

### 4.2 AI generation path

```text
React AI planner page
   │
   ▼
POST /api/v1/trips/ai-plan
   │
   ▼
Express trip-planner integration
   │
   ▼
FastAPI POST /api/trip/plan
   │
   ├─ SerpAPI top sights
   ├─ Groq structured itinerary generation
   └─ SerpAPI Google Hotels
          │
          ├─ hotels succeed → itinerary + hotel recommendations
          └─ hotels fail → itinerary still returned + hotels=[] + warning
```

The browser does not call FastAPI directly. `TRIP_PLANNER_SERVICE_URL` is server-side. The Node backend validates that the upstream response contains the expected itinerary/hotel shape and translates upstream failures into stable API errors.

### 4.3 AI plan persistence

For a new trip the generated data can be stored in `Trip.aiPlan`. For an already-created group trip the leader attaches the result through `POST /api/v1/trips/:tripId/ai-plan`. The service only allows this while the trip is `PLANNED` and owned by the authenticated tourist.

## 5. Group trip flow

Group trips introduce a membership stage before planning can be finalized.

```text
Leader selects destination + dates + GROUP
        │
        ▼
Trip created in PLANNED state
        │
        ▼
POST /api/v1/groups/trips/:tripId
        │
        ├─ group record
        ├─ leader membership
        └─ group credential / QR verification material
        │
        ▼
Group & Join ID screen
        │
        ├─ invite / QR shared
        ├─ members preview join
        ├─ members submit join request
        ├─ leader approves or rejects
        └─ member list updates
        │
        ▼
Leader confirms Lock Group
        │
        ▼
POST /api/v1/groups/:groupId/lock
        │
        ├─ requires leader
        ├─ requires PLANNED trip
        ├─ requires minimum membership rule
        ├─ rejects remaining pending join requests
        ├─ sets isLocked=true + lockedAt
        └─ blocks all future membership mutations
        │
        ▼
Leader chooses planning mode once
```

### 5.1 What lock means

After `isLocked=true`:

- new invitations are rejected,
- QR/direct joins are rejected,
- pending join approvals are rejected,
- member removal/join mutations that require an open group are blocked,
- the frontend stops polling `/join-requests`, because a locked group cannot receive new join requests.

The lock is enforced by the backend service, not merely by disabling controls in React.

### 5.2 Group AI planning permissions

Only the trip owner/group leader can generate and save an AI plan. Members can open the current trip and read the saved itinerary/hotel plan after it exists. They do not receive a plan-generation action.

```text
Leader → Plan with AI → Save Plan & Start
Member → Trip Plan → read-only view of leader's saved plan
```

## 6. Trip start, Safety ID, and consent

Starting a trip changes the lifecycle from planning to active safety operation. Required consents are persisted per trip/participant. The system can issue trip-scoped credentials/Safety IDs and optionally queue blockchain anchoring.

```text
PLANNED
  │
  ├─ planning choice finalized
  ├─ consents granted
  └─ POST /api/v1/trips/:tripId/start
        │
        ▼
ACTIVE
```

`ACTIVE` is an important boundary: planning becomes locked, location monitoring becomes meaningful, and safety/SOS flows can use the trip context.

## 7. Live location and tracking

Tracking is intentionally not Redis-cached. Live GPS is operational state and should be read from the current source of truth / realtime channel rather than served from a TTL cache.

```text
Device geolocation
   │
   ▼
POST /api/v1/tracking/pings
   │
   ├─ authenticated tourist
   ├─ tracking consent check
   ├─ trip/member context
   ├─ persist LocationPing
   ├─ update LatestTrustedLocation where valid
   ├─ safety evaluation hooks
   └─ Socket.IO publication
```

Consumers can request latest state with `/api/v1/tracking/latest` and authorized group tracking with `/api/v1/tracking/groups/:groupId`. Socket.IO handles frequent live updates so the application does not need to poll the REST API for every position change.

## 8. Safety evaluation

Safety checks are deterministic and remain usable without AI.

The backend can evaluate:

- safe/risk zones,
- circular/polygon geometry,
- check-in state,
- stale location/signal loss,
- trip overtime,
- group separation,
- route or monitoring-policy conditions where configured,
- hazard/risk-zone proximity.

### 8.1 Redis-assisted reference data

Read-heavy reference data is cached, while live operational state is not.

```text
repeated safety evaluation
        │
        ▼
cacheGetOrSet(safety/risk-zone key)
        │
        ├─ Redis hit → reuse zone set
        └─ Redis miss → PostgreSQL → Redis TTL
```

Risk-zone mutations invalidate the relevant prefixes immediately. Redis failures fail open to PostgreSQL/source APIs rather than making safety functionality unavailable.

## 9. Check-ins and alerts

The safety module supports trip check-ins and alert acknowledgement. Safety alerts are persistent application records and may also be emitted over Socket.IO.

```text
POST /api/v1/safety/trips/:tripId/check-ins
GET  /api/v1/safety/trips/:tripId/check-ins
POST /api/v1/safety/check-ins/:checkInId/complete
GET  /api/v1/safety/trips/:tripId/alerts
POST /api/v1/safety/alerts/:alertId/acknowledge
```

## 10. Signal-loss flow

When an expected group member stops producing trusted location updates, monitoring can create a signal-loss case.

```text
trusted pings stop
    │
    ▼
signal-loss case
    │
    ├─ leader receives app/email notification
    ├─ leader may respond false alarm / confirmed danger
    └─ no response or confirmed danger → escalation path
```

The emergency email service can send signal-loss alerts and reminders through Mailjet with a deep link back to the authenticated KAVACH UI.

## 11. Manual SOS flow

```text
Tourist presses SOS
        │
        ▼
POST /api/v1/sos
        │
        ├─ authenticated TOURIST required
        ├─ validate active trip/context
        ├─ use supplied or latest trusted location
        ├─ create SosRequest
        ├─ create/link emergency Incident
        ├─ persist notifications
        ├─ emit realtime events
        └─ notify Disaster Management
```

The SOS record and incident are persisted before external email delivery. A Mailjet failure must not erase or roll back an emergency.

## 12. Incident lifecycle

Canonical operational progression:

```text
OPEN
  │
  ▼
ACKNOWLEDGED
  │
  ▼
IN_PROGRESS
  │
  ├─ assignment / notes / messages / evidence / dispatch
  │
  ▼
RESOLVED
```

Authorized staff can also dismiss a non-actionable incident. Incident messages provide a communication channel between permitted actors. Every transition is validated by service logic instead of allowing clients to assign arbitrary status strings.

## 13. Disaster Management flow

Disaster Management has an operational dashboard and incident/responder endpoints under `/api/v1/disaster-management`.

```text
DM login
  → dashboard / jurisdiction overview
  → inspect incident queue
  → acknowledge incident
  → start response
  → select or auto-assign response resources
  → monitor responder status/location
  → resolve incident
```

Jurisdiction overview uses server-side Google Places searches for nearby police stations, fire stations, and hospitals. Those external lookup results are cached for hours because institutions change slowly relative to live GPS.

## 14. Emergency-service/fleet dispatch flow

Emergency-service accounts represent Police, Fire, or Ambulance organizations/units.

```text
Incident requires field response
        │
        ▼
Dispatch API
        │
        ├─ manual assignment OR nearest available unit selection
        ├─ Dispatch created
        ├─ Mailjet dispatch email sent best-effort
        └─ Socket.IO event sent
        │
        ▼
Fleet account
   → views assigned dispatch
   → accepts/updates status
   → publishes current location
   → navigates toward incident destination
   → reaches scene
   → completes dispatch
```

Responder location endpoints are live operational state and are deliberately excluded from Redis response caching.

## 15. Tourist view of an emergency fleet

The tourist's current-trip/live tracking screen can combine:

- the tourist's own position,
- authorized group-member positions,
- active emergency dispatch/fleet position,
- incident/destination position,
- calculated remaining route distance where the mapping integration provides it.

This is one map composition in the client, fed by REST bootstrap state plus realtime updates.

## 16. Hazard reporting

```text
Tourist reports hazard
  → PENDING
  → Disaster Management/System Admin verifies or rejects
  → verified hazards are queryable/visible according to rules
  → later resolve when no longer relevant
```

Nearby hazard lookup remains a source-of-truth safety query; analytics about hazards may be cached briefly, but individual operational hazard mutations are not hidden behind long-lived cache.

## 17. Risk zones

Risk zones support listing, evaluation, create/update, activation, and deactivation. The role boundary allows tourists to read/evaluate while Disaster Management/System Admin manage zone definitions.

When a zone changes, the service invalidates cached safety/risk-zone data so the next evaluation reloads fresh state from PostgreSQL.

## 18. Evidence flow

```text
authorized multipart upload
  → Multer receives file
  → MIME/size validation
  → storage adapter persists bytes/object
  → checksum/metadata persisted
  → attachment linked to target record
  → every metadata/content read re-authorizes access
```

An attachment ID by itself is never treated as permission.

## 19. Notifications and Mailjet

KAVACH separates the persisted notification from delivery channels.

```text
domain event
  │
  ├─ Notification row (in-app source of truth)
  ├─ Socket.IO event (immediate UI update)
  └─ Mailjet email (best-effort external delivery where required)
```

Mailjet is used for account OTPs, password reset codes, trip reminders, signal-loss emails, danger-zone alerts, SOS/incident alerts, and emergency dispatch deep links where the corresponding service invokes email.

## 20. Rakshak AI chatbot flow

Rakshak AI is separate from the trip planner.

```text
Authenticated client
  → AI service / chatbot route
  → shared JWT validation when enabled
  → select relevant Markdown KB documents
  → load bounded per-user history from PostgreSQL
  → optionally request live KAVACH API context
  → Groq completion
  → persist user + assistant messages
  → response
```

The chatbot cannot be the source of truth for emergency status. Live operational facts come from the main KAVACH API.

## 21. Blockchain flow

The main API does not hold the issuer private key. It communicates with the separate authenticated blockchain gateway.

```text
trip / Safety ID / proof-worthy domain event
  → create blockchain anchor job
  → background worker
  → canonicalize + hash/encrypt permitted payload
  → authenticated gateway HTTP call
  → ethers signer
  → TrustAnchor.sol
  → chain receipt/reference persisted
```

The public chain stores proof-oriented data, not raw tourist medical/profile/location payloads.

## 22. Redis caching flow

Redis is an optimization, not a correctness dependency.

Currently appropriate cached workloads include:

| Data | Typical TTL | Why |
|---|---:|---|
| destination discovery | 900 s | repeated read-heavy catalogue lookup |
| safety/risk-zone reference data | 30 s | repeated safety evaluation; mutation invalidation exists |
| Google Places jurisdiction results | 21600 s | slow/external and slow-changing |
| dashboard aggregates | 30 s | frequently requested counters |
| analytics aggregates | 20 s | expensive grouped queries where slight staleness is acceptable |

Explicitly uncached operational state includes live GPS, dispatch status/location, current trip state, group membership/join requests, notifications, SOS state, and realtime Socket.IO payloads.

`cacheGetOrSet` also coalesces concurrent identical misses inside one Node process. If 30 requests miss the same key simultaneously, one source fetch can satisfy the local burst before Redis is populated.

## 23. Analytics flow

System Admin / Disaster Management analytics endpoints aggregate PostgreSQL data for overview, incidents, trips, hazards, SOS, dispatch, responder workload, and response times. These are short-TTL cache candidates because they are read-heavy and aggregate many rows.

## 24. Audit and observability

Audit endpoints expose security/administrative event history under authorization rules. Observability endpoints expose metrics/diagnostics intended for operations. Pino/Pino HTTP produce structured request/application logs with request IDs so a production request can be traced through failures and external-provider calls.

## 25. Trip completion and cancellation

An active trip can be extended, completed, or cancelled through explicit trip lifecycle endpoints. Completion/cancellation stops the normal active-trip lifecycle and changes what tracking/safety operations are valid.

The trip lifecycle is never inferred solely from frontend navigation. PostgreSQL status is authoritative.

## 26. Failure behavior by subsystem

| Failure | Expected behavior |
|---|---|
| Redis unavailable | log warning and use PostgreSQL/external source directly |
| Mailjet unavailable | persist core domain event; email may fail independently |
| FastAPI planner unavailable | planning returns a controlled error; manual planning path remains possible before start |
| hotel provider fails | itinerary may still succeed with empty hotel recommendations |
| Rakshak AI unavailable | core safety/dispatch functionality remains operational |
| blockchain gateway unavailable | domain operation persists; proof job can retry according to integration policy |
| Socket.IO disconnect | REST source of truth remains; client reconnect/bootstrap restores state |

## 27. End-to-end happy-path example

```text
1. Register tourist
2. Verify email OTP via Mailjet-delivered code
3. Complete onboarding
4. Create GROUP trip for Prayagraj
5. Backend creates trip/group and group credential
6. Members join using QR/link
7. Leader approves members
8. Leader locks group
9. Leader chooses Plan with AI
10. Node backend calls FastAPI planner
11. SerpAPI supplies places/hotels; Groq creates itinerary
12. Leader saves plan
13. Backend starts trip immediately
14. Members see saved plan read-only
15. Phones publish trusted location pings
16. Socket.IO updates group tracking
17. Safety engine evaluates current location against cached/fresh zones
18. Tourist presses SOS
19. Incident is persisted and DM is notified
20. DM auto/manual assigns nearest emergency unit
21. Fleet account receives Mailjet + realtime dispatch notification
22. Fleet publishes live location
23. Tourist and DM see fleet movement
24. Incident/dispatch is resolved
25. Trip completes
26. Relevant proof jobs may be anchored through blockchain gateway
```

## 28. Source-of-truth rules

1. PostgreSQL is authoritative for application state.
2. Redis is disposable cache state.
3. Socket.IO transports changes; it is not durable storage.
4. Email is notification transport; it is not durable emergency state.
5. AI output is advisory/generated content persisted only when accepted by the permitted trip owner.
6. Blockchain contains tamper-evident proof/reference data, not the full mutable application database.
7. The client renders and requests actions; backend service rules enforce ownership, roles, lifecycle transitions, and locks.
