# Current realtime/cache rule

Socket.IO is the preferred delivery mechanism for frequent live state changes. Do not add Redis response caching in front of live tourist/fleet positions, dispatch status/location, active SOS/incident transitions, or group membership changes. Redis in this codebase is used for read-heavy reference/aggregate data, not as a stale realtime mirror.

# Realtime / Socket.IO Catalogue

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Connection rooms

Only accounts accepted by Socket.IO authentication join rooms. A `TOURIST` with `emailVerifiedAt = null` is rejected before joining authenticated rooms.

Authenticated sockets join:
- `account:<ROLE>:<ACCOUNT_ID>`
- `role:<ROLE>`
- tourists additionally join `tourist:<TOURIST_ID>`

Sensitive tracking/incident rooms require subscription authorization.

## Client commands

| Command | Purpose |
|---|---|
| `tracking:subscribe` | Request authorized tracking-room access |
| `tracking:unsubscribe` | Leave tracking room |
| `incident:subscribe` | Join incident room after visibility check |
| `incident:unsubscribe` | Leave incident room |
| `group:unsubscribe` | Leave group realtime room |

## Server events

| Event | Meaning |
|---|---|
| `system:ready` | Connection/service/authentication metadata |
| `location:updated` | New trusted location |
| `incident:created` | Incident created |
| `incident:updated` | Incident lifecycle/assignment change |
| `incident:note` | Staff operational note |
| `incident:message` | Incident conversation message |
| `notification:created` | New notification |
| `notification:read` | One notification read |
| `notification:read-all` | Account notifications read |
| `hazard:created` | Hazard created |
| `hazard:updated` | Hazard changed |
| `risk-zone:updated` | Risk-zone changed |
| `responder:status` | Responder availability changed |
| `dispatch:updated` | Dispatch changed |
| `emergency-unit:updated` | Emergency-unit state changed |
| `evidence:created` | Evidence created |
| `evidence:deleted` | Evidence deleted |
| `blockchain:integrity` | Tourist trip DB integrity changed: `DB_TAMPERED` or restored `VERIFIED` |

REST remains the authoritative recovery/read path. Realtime does not bypass REST authorization.

## Tourist verification prerequisite

Email OTP itself is handled over REST, not Socket.IO. After successful `POST /api/v1/auth/verify-email`, the issued session/access token can be used for authenticated realtime connections.

## Emergency response realtime events

Service location and status changes publish `dispatch:updated`. Events go to Disaster Management/System Admin role rooms, the incident room used by the tourist, and the assigned Police/Fire/Ambulance account room when unit ownership is present. Unit location/status changes also publish `emergency-unit:updated`.

## Emergency responder tracking update

Responder location/status changes publish `dispatch:updated` through incident/role rooms. The event is supplemental to the REST source of truth: clients should refetch/merge backend dispatch state and must not treat an unverified Socket.IO payload as authorization. Danger-zone/signal-loss detection does not emit a responder assignment until Disaster Management actually creates/assigns the dispatch.


## Blockchain integrity realtime event

For confirmed individual credentials on `PLANNED` or `ACTIVE` trips, the integrity watcher compares protected PostgreSQL fields against the latest trusted encrypted blockchain snapshot. Direct database writes bypass the API, so detection is performed by a five-second watcher and the result is delivered to the authenticated tourist through Socket.IO.

When a mismatch is found the server first emits `blockchain:integrity` with `status: DB_TAMPERED`, the protected field names, credential ID and trip ID. It then restores the trusted values inside a database transaction, writes `BLOCKCHAIN_DB_RESTORED` to the audit log, and emits a second `blockchain:integrity` event with `status: VERIFIED` and `restored: true`. The Current Trip UI keeps the tamper state visible briefly before rendering the restored verified state so both transitions are observable.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

## Blockchain integrity lifecycle

Authenticated tourist sockets receive `blockchain:integrity` updates for relevant individual credentials and, for active members, relevant group credentials. Payloads identify the entity type and credential and carry states including `CHECKING`, `VERIFIED`, `DB_TAMPERED`, `FIXING`, `FIXED`, and `INTEGRITY_UNAVAILABLE`.

The Current Trip UI maps the healthy `VERIFIED` state to `APPROVED`. A tamper repair is deliberately visible as `TAMPERED -> FIXING -> FIXED -> APPROVED`.

## 2026-08-27 realtime sync

Realtime consumers should expect incident/dispatch state to converge with the database after completion/cancellation and trip lifecycle cleanup. Responder GPS updates are frequent telemetry and should update marker position without forcing clients to reset map zoom/pan on every event.

---

## Repository synchronization — 2026-08-27

Realtime tracking/incident events complement polling but are not the sole persistence mechanism. Responder location continues to be written through authenticated dispatch-location updates; tourist/staff maps can refresh from shared tracking snapshots if a socket event is missed.
