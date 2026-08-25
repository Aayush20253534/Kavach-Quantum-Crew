# Backend Technical Flow for JavaScript Developers

This is the **start-here technical document** for the KAVACH / Smart Tourist Safety backend.

It is written for a developer who understands normal JavaScript concepts such as objects, functions, promises, modules, HTTP requests, and `async/await`, but may not yet know Express architecture, Prisma, PostgreSQL, JWT authentication, middleware, queues, Socket.IO, Redis, background jobs, or blockchain integration.

The goal is not merely to list files. It explains **what each major term means, why the component exists, and what actually happens to a request from the moment it reaches the server until a response is returned**.

## 1. Mental model of the backend

At the highest level the backend is a Node.js program that accepts requests from the frontend and coordinates several systems:

```text
Browser / mobile client
        |
        | HTTP + JSON
        | Socket.IO for realtime events
        v
Node.js + Express backend
        |
        +---- PostgreSQL through Prisma
        +---- Upstash Redis cache
        +---- Email / SMS / push providers
        +---- Google Maps adapters
        +---- AI provider boundary
        +---- Blockchain gateway
        +---- Socket.IO connected clients
```

Most features follow this internal path:

```text
Route
  -> middleware
  -> controller
  -> service
  -> repository
  -> Prisma/PostgreSQL
  -> service result
  -> controller response
```

Do not memorize that as ceremony. Each layer answers a different question:

- **route**: which URL and HTTP method runs this feature?
- **middleware**: is the request allowed and structurally acceptable before feature logic runs?
- **controller**: how do HTTP request fields map into JavaScript service calls?
- **service**: what are the business rules?
- **repository**: how is data read/written?
- **database**: where is persistent state stored?

## 2. Runtime and required software

The backend requires:

- Node.js `>=20.19.0`
- npm `>=10`
- PostgreSQL
- environment variables from `.env`

Optional/external systems are enabled depending on configuration:

- Upstash Redis
- Socket.IO clients
- Gmail SMTP / notification providers
- Google Maps
- blockchain gateway + blockchain RPC
- AI provider integrations

The project uses ES modules because `package.json` contains:

```json
{
  "type": "module"
}
```

That is why source files use:

```js
import express from "express";
export const something = ...;
```

instead of CommonJS `require()` and `module.exports`.

## 3. Important npm modules and what they mean

| Module | What it is | Why this backend uses it |
|---|---|---|
| `express` | HTTP web framework for Node.js | Routes, middleware, requests, responses |
| `@prisma/client` | Generated database client | Read/write application data |
| `@prisma/adapter-pg` + `pg` | PostgreSQL connection adapter/driver | Connect Prisma to PostgreSQL |
| `zod` | Runtime schema validation library | Validate environment values and request bodies/params |
| `jsonwebtoken` | JWT signing and verification | Login/auth tokens and signed QR credentials |
| `argon2` | Password hashing algorithm | Store password hashes instead of plaintext passwords |
| `cookie-parser` | Express cookie parser | Read cookies from incoming requests |
| `cors` | Cross-Origin Resource Sharing middleware | Allow approved frontend origins to call the API |
| `helmet` | Security-header middleware | Adds HTTP response headers that reduce common browser risks |
| `express-rate-limit` | Request throttling | Slow abusive or accidental request floods |
| `multer` | Multipart upload parser | Receive uploaded evidence/files |
| `socket.io` | Realtime client/server library | Push live events without repeated HTTP polling |
| `nodemailer` | Email sending library | Email verification/notification delivery |
| `firebase-admin` | Firebase server SDK | Push-notification integration |
| `@aws-sdk/client-s3` | S3-compatible object-storage client | External file/object storage adapter |
| `axios` | HTTP client | External API integrations where used |
| `qrcode` | QR image generator | Generate credential QR Data URLs |
| `pino` / `pino-http` | Structured logger | Machine-readable application/request logs |
| `node-cron` | Job scheduler | Time-based recurring work where configured |
| `jest` | Test framework | Automated tests |
| `supertest` | HTTP testing helper | Test Express routes without a real external server |

Redis support intentionally uses Upstash's HTTP REST API through built-in `fetch`, so there is no Redis npm client dependency.

## 4. Folder structure

```text
server/
├── prisma/
│   ├── schema.prisma          # database models
│   └── seed.js                # seed/demo data
├── src/
│   ├── app.js                 # builds Express application
│   ├── server.js              # starts HTTP server + runtime jobs
│   ├── common/                # reusable responses/errors/utils/cache
│   ├── config/                # env, DB, Redis, CORS, security, logging
│   ├── constants/             # roles/status/type constants
│   ├── middleware/            # cross-cutting request processing
│   ├── modules/               # feature/domain code
│   ├── integrations/          # external system adapters
│   ├── jobs/                  # background work
│   ├── realtime/              # Socket.IO server/event helpers
│   └── routes/                # top-level API router
├── tests/                     # Jest/Supertest tests
├── documentation/             # project documentation
├── openapi.yaml               # machine-readable API contract
└── package.json               # dependencies + scripts
```

## 5. What happens when the process starts

The executable entry point is `src/server.js`.

### Step 1: environment is parsed

Importing `environment` loads `.env` values and validates them with Zod.

Why validate configuration at startup? Because failing immediately with `DATABASE_URL is invalid` is better than discovering three minutes later that a request cannot connect to a database.

### Step 2: PostgreSQL connects

`database.connect()` calls Prisma's `$connect()`.

A **database connection pool** is a reusable set of open database connections. Opening a new TCP/database connection for every API request is expensive, so the PostgreSQL adapter maintains a configurable pool.

### Step 3: Node HTTP server is created

`createServer(application)` wraps the Express app in Node's native HTTP server.

This is necessary because Socket.IO also attaches to the same underlying HTTP server.

### Step 4: Socket.IO starts if enabled

When `SOCKET_IO_ENABLED=true`, `createSocketServer()` attaches realtime behavior.

### Step 5: the port begins listening

The server binds to `HOST` and `PORT`.

Production normally uses `0.0.0.0`, meaning accept connections on all network interfaces inside the host/container.

### Step 6: background jobs start

At startup the runtime starts jobs such as:

- trip lifecycle processing
- blockchain anchor queue processing

Other job modules handle safety ID expiry, stale location, missed check-ins, and retention/lifecycle responsibilities depending on how they are invoked by the application/test runtime.

### Step 7: graceful shutdown handlers are registered

The process listens for signals such as `SIGTERM` and `SIGINT`.

A **graceful shutdown** means the server stops accepting work, closes Socket.IO/HTTP connections, stops jobs, disconnects the database, and then exits instead of abruptly killing resources halfway through work.

This matters on Render, Docker, Kubernetes, and ordinary Ctrl+C termination.

## 6. How `app.js` builds the HTTP pipeline

Express middleware runs in the order it is registered. Order matters.

The application pipeline is approximately:

```text
request
  -> request ID
  -> observability timing/context
  -> HTTP logger
  -> Helmet security headers
  -> CORS
  -> JSON parser
  -> URL-encoded parser
  -> cookie parser
  -> request security checks
  -> public root + health routes
  -> API privacy headers
  -> rate limits
  -> API router
  -> 404 handler
  -> error handler
```

### Request ID

A request ID is a unique value attached to one incoming request. It lets logs from multiple functions be correlated when many users are hitting the server simultaneously.

### Observability

**Observability** means collecting enough information to understand what a running system is doing. That normally includes logs, request latency, error counts, and health information.

### Helmet

Helmet adds defensive HTTP headers. It does not replace authentication or input validation. It simply reduces exposure to several browser/protocol-level attacks.

### CORS

Browsers enforce origin rules. CORS tells the browser which frontend origins may call the backend.

CORS is not an authentication mechanism. A malicious server-to-server client can ignore browser CORS rules entirely.

### Body parsing

`express.json()` converts a JSON request body into `request.body`.

Example:

```http
POST /api/v1/example
Content-Type: application/json

{"name":"A"}
```

becomes:

```js
request.body.name === "A";
```

### Cookie parsing

`cookie-parser` turns the raw `Cookie` HTTP header into `request.cookies`.

### Request security middleware

This layer rejects structurally suspicious or excessively complex inputs and applies privacy-oriented behavior before domain routes run.

### Rate limiting

A rate limiter counts requests over a time window and rejects excessive traffic. The project has general API and sensitive-action limits.

### 404 middleware

If no route matched, `notFoundMiddleware` creates the standard not-found response.

### Error middleware

Express error middleware is the final safety net. Domain code throws `ApiError`; async wrappers/middleware forward errors; the handler converts them to the project's standard JSON error envelope.

## 7. Root routes versus API routes

The application exposes public operational endpoints before the versioned API:

```text
GET /
GET /health
GET /health/ready
...
```

The main API is mounted under the configured prefix, normally:

```text
/api/v1
```

So a feature route defined as `/trips` becomes:

```text
/api/v1/trips
```

The top-level router lives in `src/routes/index.js`.

## 8. Understanding one module

Most domain folders follow this shape:

```text
trip/
├── trip.routes.js
├── trip.controller.js
├── trip.service.js
├── trip.repository.js
└── trip.validation.js
```

### `.routes.js`

Routes connect URL + method to middleware + controller.

Conceptually:

```js
router.post(
  "/",
  authenticate,
  validate(createTripSchema),
  tripController.create,
);
```

This reads as: for `POST /`, authenticate the caller, validate the input, then run the create controller.

### `.controller.js`

A controller speaks HTTP.

It reads values from:

- `request.params`
- `request.query`
- `request.body`
- authenticated user context

Then it calls the service and returns `ApiResponse`.

A controller should not contain complex business rules or handwritten SQL.

### `.service.js`

A service contains application rules.

Examples:

- can this user create this resource?
- is the trip in a state where this transition is legal?
- should another record be created?
- should a notification be sent?
- should a blockchain job be queued?

Services coordinate repositories and integrations.

### `.repository.js`

A repository isolates database access.

Instead of scattering:

```js
prisma.trip.findMany(...)
```

everywhere, feature code calls repository methods with meaningful names.

This improves testability and keeps database query details out of business logic.

### `.validation.js`

Validation schemas describe acceptable external input. Zod checks types, required fields, enums, formats, and constraints before service logic trusts the data.

## 9. Promise and async error handling

Database queries, network calls, password hashing, email delivery, and many other operations are asynchronous.

The backend therefore uses `async`/`await` extensively.

A reusable `asyncHandler` pattern prevents every controller from needing repetitive `try/catch` code. Rejected promises are forwarded to Express's centralized error handler.

The distinction is important:

- expected domain problem: throw `ApiError` with a useful status/code
- unexpected programmer/provider failure: allow centralized handling/logging to produce a safe server error

## 10. Standard success and error responses

`ApiResponse` keeps success responses consistent across features.

`ApiError` gives domain errors a predictable HTTP status, code, message, and optional details.

Consistency matters because the frontend should not need a different error parser for every route.

See [`ERROR-CATALOGUE.md`](ERROR-CATALOGUE.md) for concrete error codes.

## 11. Authentication: proving who the caller is

**Authentication** answers: "Who are you?"

The system uses signed JWTs for authenticated API sessions.

### JWT

JWT means JSON Web Token. It is a signed string containing claims.

A simplified token payload might contain a user ID and token metadata. Because the server signs it with a secret/private signing configuration, tampering causes verification to fail.

Important point: JWT contents are encoded, not automatically encrypted. Do not put sensitive secrets into a token merely because it looks unreadable at first glance.

### Password storage

Passwords are hashed with Argon2. Hashing is one-way; the application verifies a login by asking Argon2 whether the supplied password matches the stored hash.

The backend should never store plaintext passwords.

### Authentication middleware

`authenticate.middleware.js` verifies the presented auth token and attaches the authenticated identity/context to the request for later middleware/controllers.

## 12. Authorization: deciding what the caller may do

**Authorization** answers: "Now that I know who you are, are you allowed to do this?"

The project contains roles and permissions in `src/constants/roles.js` and `src/constants/permissions.js`, with enforcement in authorization/domain middleware and services.

For example, being authenticated does not automatically make a tourist a system administrator or an emergency dispatcher.

See [`ROLE-PERMISSIONS.md`](ROLE-PERMISSIONS.md).

## 13. Consent guards

Some safety/location functionality depends on user consent.

A consent guard is middleware/domain logic that checks the required consent state before allowing protected tracking or safety behavior.

This is separate from authentication:

```text
authenticated user != automatically consented user
```

## 14. Request validation

Never trust browser input simply because your own frontend generated it. Anyone can send HTTP requests manually.

Validation checks can include:

- string length
- enum membership
- UUID/identifier format
- numeric bounds
- coordinate ranges
- required/optional fields
- nested object shape

The `validate.middleware.js` layer applies Zod schemas from each module.

## 15. PostgreSQL and Prisma

### PostgreSQL

PostgreSQL is the primary persistent relational database.

**Relational** means data is organized into tables whose rows are connected through keys/relationships.

Examples of relationships in this application include users belonging to trips/groups, incidents associated with safety events, and credentials associated with trips.

### Prisma

Prisma is an ORM/database toolkit. ORM means **Object-Relational Mapping**: JavaScript code works with generated model APIs instead of manually constructing most SQL strings.

Example conceptually:

```js
await prisma.trip.findUnique({ where: { id: tripId } });
```

Prisma converts that operation into database queries and turns returned rows into JavaScript objects.

### `schema.prisma`

`prisma/schema.prisma` is the database model definition. It defines:

- models/tables
- fields/columns
- field types
- relations
- unique constraints
- indexes
- defaults

### Migration

A database migration is a versioned change to database structure, such as adding a column or table. Production schema changes should be applied through controlled Prisma migration/deployment processes rather than editing a live database by hand.

### Transaction

A database transaction groups operations so they succeed or fail as one unit.

For example, the blockchain queue updates both job state and credential chain state in a Prisma transaction. That avoids one record saying `CONFIRMED` while the related record still says `PENDING` because the process crashed between writes.

## 16. Database domain map

The schema covers several major groups:

- accounts and authentication
- tourist profiles
- trips and group membership
- consent
- tracking and check-ins
- safety state and alerts
- SOS and incidents
- emergency dispatch/responders
- hazards/risk zones/monitoring
- evidence
- notifications and delivery attempts
- audit/observability records
- individual/group trip credentials
- asynchronous blockchain anchor jobs

See [`DATABASE-OVERVIEW.md`](DATABASE-OVERVIEW.md) for a compact map and `prisma/schema.prisma` for exact fields.

## 17. Redis caching

Redis is an in-memory key-value datastore. In this project the optional Redis path uses Upstash's HTTP API.

A **cache** stores a temporary copy of data so repeated reads can avoid more expensive database work.

Current cache targets include values such as:

- dashboard counts
- destination lists
- active risk-zone reads

Sensitive or correctness-critical write flows such as authentication, OTP, SOS creation, incidents, and live-location writes are not made dependent on cached state.

### TTL

TTL means Time To Live. A cached entry with a 30-second TTL automatically becomes stale/expired after that period.

### Fail-open cache

Redis is designed as an optimization here, not the source of truth. If Redis fails, code falls back to PostgreSQL instead of making the entire API unavailable.

## 18. REST API concepts used here

REST in this project primarily means resources exposed through HTTP methods and predictable URLs.

Common methods:

- `GET`: read
- `POST`: create/action
- `PATCH`: partially update
- `PUT`: replace/update when a route uses it
- `DELETE`: remove/revoke when a route uses it

Common status classes:

- `2xx`: success
- `4xx`: caller/input/auth/domain problem
- `5xx`: server/provider/infrastructure problem

See [`ENDPOINTS.md`](ENDPOINTS.md) for the mounted route catalogue and `openapi.yaml` for the machine-readable API contract.

## 19. Major backend modules

The top-level router currently mounts these major domains:

| Path | Module responsibility |
|---|---|
| `/auth` | registration, login, verification/auth lifecycle |
| `/tourists` | tourist profile operations |
| `/trips` | trip lifecycle |
| `/groups` | group trips, membership, join requests |
| `/credentials` | individual/group trip QR credentials |
| `/tracking` | location/tracking operations |
| `/safety` | safety state/check logic |
| `/alerts` | safety alerts |
| `/sos` | manual/emergency SOS |
| `/incidents` | incident lifecycle and incident communication |
| `/disaster-management` | disaster-management operations |
| `/notifications` | user-facing notification records |
| `/notification-deliveries` | provider delivery/retry state |
| `/escalations` | escalation rules/workflow |
| `/hazards` | hazard records |
| `/risk-zones` | geospatial risk-zone data |
| `/monitoring` | monitoring operations |
| `/dispatch` | emergency unit dispatch |
| `/evidence` | evidence metadata/upload flow |
| `/admin` | system administration |
| `/analytics` | aggregate/reporting endpoints |
| `/chatbot` | tourist chatbot/provider boundary |
| `/dashboard` | dashboard aggregations |
| `/destinations` | destination discovery/read models |
| `/integrations` | AI/blockchain integration contracts/status |
| `/audit` | audit records/querying |
| `/observability` | operational visibility endpoints |
| `/health` | application/readiness/database checks |

Not every module is intended for every role. Authentication and permission rules are defined at route/service boundaries.

## 20. Trip flow

A trip is a central domain object because many safety behaviors exist only in the context of an active/planned journey.

A simplified flow is:

```text
Tourist authenticates
  -> creates/plans trip
  -> trip persisted in PostgreSQL
  -> optional group/individual credentials created
  -> trip becomes active according to lifecycle rules
  -> location/check-in/safety logic operates
  -> alerts/SOS/incidents may be generated
  -> trip completes/expires
  -> credentials/monitoring state transition accordingly
```

The detailed human-readable flow is in [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).

## 21. Group trip flow

Group functionality adds membership and approval rules on top of the trip model.

A QR/invite can identify a join opportunity, but possession of a QR is not equivalent to authorization. The backend can require leader approval before creating membership.

Group credentials and individual credentials are distinct records. A group credential can represent the group's trip identity while each member can still have an individual credential.

## 22. Safety monitoring flow

Safety features combine current application state, trip state, tracking/check-ins, hazards/risk zones, and configured rules.

The important architectural principle is that deterministic safety decisions live in backend services. They are not delegated blindly to the frontend.

A frontend can request or display safety state, but server-side rules remain authoritative because client code can be modified by the user.

## 23. SOS to incident flow

A simplified emergency path is:

```text
SOS request
  -> authenticate/validate
  -> SOS service records emergency
  -> incident/alert state created or linked
  -> notification/escalation behavior triggered
  -> realtime event emitted
  -> dispatch workflows can assign response units
  -> incident communication/evidence updates continue
  -> audit/observability records support operations
```

This flow crosses several modules because emergency response is not a single table or endpoint.

## 24. Notifications

The system separates a notification's logical existence from delivery through external channels.

That distinction is useful because:

```text
"we need to notify this user"
```

and

```text
"Firebase/SMTP/SMS provider successfully delivered it"
```

are different facts.

Provider adapters isolate vendor-specific APIs from domain services. Delivery records/retries let failures be tracked instead of silently disappearing.

See [`NOTIFICATION-DELIVERY.md`](NOTIFICATION-DELIVERY.md).

## 25. Email verification

Tourist signup/email-change flows can require an OTP sent by email.

OTP means **One-Time Password**: a short code intended for a single verification action and limited time window.

The backend generates/verifies the OTP and uses Nodemailer/Gmail SMTP only as the delivery mechanism. Gmail does not decide whether the OTP is correct.

See [`EMAIL-VERIFICATION.md`](EMAIL-VERIFICATION.md).

## 26. File uploads and evidence

`multer` parses multipart form uploads. Evidence code separates metadata/business rules from storage adapters.

An object-storage adapter may send bytes to S3-compatible/cloud storage while PostgreSQL stores the metadata/reference needed by the application.

This pattern avoids bloating ordinary relational rows with large binary files.

## 27. Geospatial utilities

The backend contains utilities/adapters for:

- coordinates
- geofences
- distance calculations
- route distance
- Google Maps directions/geocoding/places
- risk-zone geometry

### Geofence

A geofence is a virtual geographic boundary. Logic can determine whether a point lies inside/outside a defined region.

### Geocoding

Geocoding converts human-readable places/addresses to geographic coordinates or performs the reverse operation depending on the API.

External maps are integration helpers; authoritative safety rules still live in backend services.

## 28. Realtime with Socket.IO

HTTP is request/response: the client asks, the server answers.

Realtime features need the server to push information without waiting for the browser to poll repeatedly. Socket.IO provides a long-lived logical connection for that.

### Socket

A socket here is an active client connection managed by Socket.IO.

### Room

A room is a named group of connected sockets. The server can emit an event to all clients interested in a specific trip/incident/user context instead of broadcasting private data to everyone.

### Event

An event is a named realtime message with a payload.

Authentication still matters for sockets. Opening a connection should not automatically grant access to arbitrary rooms.

See [`REALTIME-EVENTS.md`](REALTIME-EVENTS.md).

## 29. Background jobs

A background job performs work outside the immediate HTTP request/response path.

Examples include:

- blockchain anchoring
- trip lifecycle transitions
- stale-location handling
- missed check-ins
- credential/safety-ID expiry
- retention cleanup

Why background jobs exist:

- some work should happen later
- some work repeats periodically
- some work can fail/retry independently
- the user should not hold an HTTP connection open while infrastructure catches up

A job can be timer-based, cron-based, or queue-backed depending on the feature.

## 30. Blockchain integration

The backend does **not** import Hardhat/Solidity code and does not hold the issuer private key.

Instead:

```text
credential service
  -> hash privacy-safe credential identity
  -> create DB BlockchainAnchorJob
  -> background worker
  -> HTTP call to isolated blockchain gateway
  -> gateway signs transaction
  -> smart contract
```

This is an asynchronous queue pattern.

### Why asynchronous?

Blockchain transactions can be slow or temporarily fail. A tourist API request should not become unusable merely because an RPC provider is having a bad minute.

### Chain states

Credential records can report states such as:

- `DISABLED`
- `PENDING`
- `CONFIRMED`
- `FAILED`

### Gateway key vs issuer private key

The Express backend knows a shared gateway API key. The gateway knows the blockchain wallet private key.

Those are intentionally different secrets with different privileges.

For the complete end-to-end chain explanation, see [`../../blockchain/docs/workflow.md`](../../blockchain/docs/workflow.md) and [`BLOCKCHAIN-CATALOGUE.md`](BLOCKCHAIN-CATALOGUE.md).

## 31. AI integration boundary

AI functionality is behind provider/service boundaries so model/provider details do not spread across unrelated business modules.

A critical architectural rule is to distinguish:

- deterministic authorization/safety rules
- probabilistic AI suggestions/analysis

AI output should not silently bypass server permissions or become the sole authority for critical safety state.

See [`AI-CATALOGUE.md`](AI-CATALOGUE.md).

## 32. External integration adapters

An adapter translates between your application's language and an external provider's API.

Examples:

```text
application concept       provider-specific implementation
----------------------------------------------------------
send email             -> SMTP/Nodemailer
send push              -> Firebase Admin
store object           -> S3 client
get directions         -> Google Maps API
write trust anchor     -> blockchain gateway
```

Keeping adapters separate means a provider can be replaced without rewriting every controller.

## 33. Logging

Pino produces structured JSON-friendly logs rather than relying only on arbitrary `console.log` strings.

Structured log example conceptually:

```json
{
  "level": "error",
  "requestId": "...",
  "incidentId": "...",
  "message": "Dispatch failed"
}
```

Machines can search/filter these fields more reliably than parsing prose.

Never log secrets such as passwords, JWT signing secrets, gateway keys, private keys, or OTP secrets.

## 34. Health and readiness

A **liveness** check answers: "Is this process alive?"

A **readiness** check answers: "Is this process ready to serve useful requests?"

A service can be alive but not ready, for example when PostgreSQL is unavailable.

The backend exposes root and health routes outside ordinary feature authentication so hosting platforms and uptime monitors can probe them.

## 35. Reverse proxy and `trust proxy`

Production hosts such as Render usually put a reverse proxy in front of Node.

A **reverse proxy** receives public internet traffic and forwards it to your application process. The real client IP is then typically provided through forwarding headers.

Express `trust proxy` tells middleware such as rate limiting when those forwarding headers may be trusted.

Misconfiguring this can make every user appear to come from the same proxy IP or can make spoofed headers dangerous.

## 36. Security layers in this backend

Security is layered because no single library solves everything:

```text
TLS/hosting
+ CORS policy
+ Helmet headers
+ request size/shape limits
+ rate limiting
+ authentication
+ authorization
+ consent rules
+ validation
+ password hashing
+ JWT verification
+ secret separation
+ audit logging
+ privacy-safe integration boundaries
```

This is called **defense in depth**: if one control fails or is bypassed, other controls still reduce damage.

## 37. Environment variables

Environment variables are configuration values provided outside source code.

Examples:

```text
DATABASE_URL
PORT
CORS_ORIGINS
JWT secrets/config
SMTP credentials
GOOGLE_MAPS_API_KEY
BLOCKCHAIN_GATEWAY_URL
```

Secrets should not be committed to Git. `.env.example` documents names/placeholders; the real `.env` stays private.

Zod validates environment configuration in `src/config/environment.js`.

See [`ENVIRONMENT.md`](ENVIRONMENT.md).

## 38. Dependency injection patterns used in the code

Several constructors/functions accept optional dependencies, for example app/server creation.

This is a form of **dependency injection**: instead of a function always creating every dependency internally, tests can pass replacements.

Conceptually:

```js
createApp({ healthService: fakeHealthService });
```

Why it matters: tests can exercise application behavior without requiring every real external system.

## 39. Testing model

The project uses Jest for unit/integration tests and Supertest for HTTP behavior.

Useful test categories include:

- validation tests
- service/domain rule tests
- repository/database integration tests
- endpoint tests
- permission/auth tests
- lifecycle regression tests
- external-adapter boundary tests

A regression test verifies that behavior which previously worked continues working after changes.

See [`TESTING.md`](TESTING.md) and [`FINAL-QA-CHECKLIST.md`](FINAL-QA-CHECKLIST.md).

## 40. Reading an endpoint from URL to database

When trying to understand any unfamiliar endpoint, follow this exact method:

```text
1. Find the path in ENDPOINTS.md or routes files.
2. Open that module's *.routes.js.
3. Read middleware left-to-right.
4. Open the referenced controller method.
5. Open the called service method.
6. List business-rule branches/throws.
7. Open repository methods it calls.
8. Find the corresponding models in schema.prisma.
9. Check integrations/events/jobs triggered by the service.
10. Check tests for expected behavior and edge cases.
```

This is much faster than reading the repository alphabetically, which is a reliable way to learn nothing while feeling industrious.

## 41. Example request lifecycle

Suppose an authenticated route creates a resource.

```text
Client sends POST JSON
        |
        v
Node HTTP server
        |
        v
Express app.js middleware
  requestId -> logs -> security -> parser -> rate limit
        |
        v
Top-level /api/v1 router
        |
        v
Feature route
  authenticate -> authorize? -> validate
        |
        v
Controller
  extracts body/user/params
        |
        v
Service
  checks business rules
  calls repository
  maybe integration/event/job
        |
        v
Repository
  Prisma query/transaction
        |
        v
PostgreSQL
        |
        v
Service returns domain result
        |
        v
Controller uses ApiResponse
        |
        v
JSON response to client
```

If any stage throws, the centralized error middleware converts it to the standard error response and logs the request context.

## 42. How to add a new backend feature correctly

A normal new domain capability should usually be implemented in this order:

1. define/confirm data model in Prisma if persistence is needed
2. add constants/enums if domain states are required
3. create validation schemas
4. create repository operations
5. create service business rules
6. create controller HTTP mapping
7. create routes with auth/authorization/validation middleware
8. mount the router if it is a new top-level module
9. add integration adapter calls rather than embedding provider code in the controller
10. add tests
11. update `ENDPOINTS.md`, relevant domain docs, `openapi.yaml`, environment docs, and this technical flow if architecture changes

## 43. Things that should not be done

Avoid these shortcuts:

- database queries directly from route files
- huge controllers containing all business rules
- trusting frontend-provided role/user identity without JWT verification
- storing plaintext passwords or OTP secrets
- exposing `.env` values to browser code
- putting blockchain private keys in Express/frontend config
- returning raw provider stack traces to users
- swallowing errors with empty `catch` blocks in critical flows
- using Redis as the sole copy of authoritative data
- using AI output as an authorization decision
- writing raw personal data to a public blockchain
- adding a route without validation because "the frontend already validates it"

## 44. Documentation map

Read these depending on what you are changing:

| Document | Read it when... |
|---|---|
| [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md) | you need the end-to-end technical mental model |
| [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md) | you need the product/domain flow in simpler language |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | you need backend component boundaries |
| [`ENDPOINTS.md`](ENDPOINTS.md) | you need route inventory |
| [`DATABASE-OVERVIEW.md`](DATABASE-OVERVIEW.md) | you need data-domain orientation |
| [`ROLE-PERMISSIONS.md`](ROLE-PERMISSIONS.md) | you are touching permissions |
| [`ERROR-CATALOGUE.md`](ERROR-CATALOGUE.md) | you are adding/handling errors |
| [`REALTIME-EVENTS.md`](REALTIME-EVENTS.md) | you are touching Socket.IO |
| [`NOTIFICATION-DELIVERY.md`](NOTIFICATION-DELIVERY.md) | you are touching provider delivery/retries |
| [`EMAIL-VERIFICATION.md`](EMAIL-VERIFICATION.md) | you are touching signup/email OTP |
| [`AI-CATALOGUE.md`](AI-CATALOGUE.md) | you are touching AI integration |
| [`BLOCKCHAIN-CATALOGUE.md`](BLOCKCHAIN-CATALOGUE.md) | you need backend blockchain contracts/status fields |
| [`../../blockchain/docs/workflow.md`](../../blockchain/docs/workflow.md) | you need the complete blockchain execution flow |
| [`ENVIRONMENT.md`](ENVIRONMENT.md) | you are configuring deployment/secrets |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | you are deploying the backend |
| [`Docker.md`](Docker.md) | you are running/deploying with Docker |
| [`TESTING.md`](TESTING.md) | you are writing/running tests |
| [`FINAL-QA-CHECKLIST.md`](FINAL-QA-CHECKLIST.md) | you are preparing a release/demo |
| [`INTEGRATION-HANDOFF.md`](INTEGRATION-HANDOFF.md) | another team/provider needs interface ownership info |

## 45. Final mental model

If you know JavaScript, reduce the backend to this:

**Express receives untrusted HTTP input; middleware establishes safe request context; controllers translate HTTP to function calls; services enforce the actual product rules; repositories use Prisma to persist those rules in PostgreSQL; adapters talk to external systems; Socket.IO pushes realtime changes; jobs perform delayed/retryable work; Redis accelerates selected reads; and centralized configuration, logging, errors, tests, and documentation keep the whole thing operable.**

## Technical emergency dispatch flow

Auto assignment loads the incident coordinates, fetches available units of the selected type with non-null coordinates, computes Haversine distance, assigns the nearest unit, records a dispatch event/audit entry, and marks the unit unavailable for competing dispatches. Service tracking persists coordinates in PostgreSQL and fans updates out through Socket.IO. See `EMERGENCY-SERVICE-DISPATCH.md` for API details and terminology.

## 40. Latest signal-loss, responder, and blockchain snapshot flow

### Signal-loss state machine

For active group trips, `signalLoss.job.js` periodically checks each non-leader member's latest trusted location. After the configured tracking gap (default 5 minutes), the service creates a persisted `SignalLossCase`, sends leader + Disaster Management notifications/email, and records a 5-minute response deadline. `FALSE_ALARM` resolves the case; `CONFIRMED_DANGER` or deadline expiry creates/escalates a `TRACKING_INTERRUPTION` safety alert into the incident pipeline. If the member remains offline, `nextReminderAt` schedules 5-minute reminders after a handled response and resets the 5-minute response window. Returning online resolves the case and linked alert.

### Emergency-service dispatch boundary

Danger-zone/signal-loss events do not call responder assignment automatically. Disaster Management initiates dispatch. `POST /dispatch/incidents/:incidentId/auto/:serviceType` means “select the nearest available unit for this requested service,” not “automatically notify responders when an incident exists.” After assignment, responder email and realtime state are emitted. The responder page writes browser GPS through `/emergency-services/dispatches/:dispatchId/location`; authorized viewers read `/emergency-services/tracking/:dispatchId`.

### Blockchain snapshot pipeline

`credential.service.js` still generates the existing `idHash` and queues `ISSUE`. It additionally queues `SNAPSHOT` jobs. `blockchain.snapshot.js` canonicalizes JSON, computes SHA-256, and encrypts the payload with AES-256-GCM using `BLOCKCHAIN_DATA_ENCRYPTION_KEY`. The queue sends ciphertext/hash/sequence/type to the gateway, which calls `TrustAnchor.appendDataSnapshot`. Snapshot jobs deliberately do not mutate the underlying credential `chainStatus`/issuance transaction state.

`blockchainIntegrity.job.js` runs every five seconds for confirmed individual credentials on open trips, with an overlap guard so a slow reconciliation cycle cannot run twice concurrently. It reads the latest type-1 snapshot, decrypts it, verifies the hash and credential identity, compares name/DOB/email/phone/destination against PostgreSQL, restores differences, and records `BLOCKCHAIN_DB_RESTORED`. A decrypt/hash/identity mismatch is never trusted as recovery data.


### Realtime blockchain integrity status

When reconciliation detects protected PostgreSQL values that differ from the latest trusted individual snapshot, `blockchain.integrity.service.js` publishes `blockchain:integrity` with `DB_TAMPERED` to the tourist account room before applying the repair. After the transaction restores the chain-backed values and records `BLOCKCHAIN_DB_RESTORED`, it publishes `VERIFIED`. This makes the trip credential card reflect the detection/correction lifecycle over Socket.IO while REST/PostgreSQL remain the operational source of truth after reconciliation.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

## Snapshot data boundary

The server, not Solidity, knows the plaintext snapshot schema. Individual type `1` includes name, DOB, destination, phone and email plus identifiers. Group type `2` includes group name, member count, destination, leader contact identity and append-only added-member context. The server canonicalizes and hashes plaintext, encrypts with AES-256-GCM, and submits only hash/ciphertext plus sequence/type metadata to the gateway.
