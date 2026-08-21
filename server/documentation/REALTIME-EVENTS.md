# Realtime / Socket.IO Catalogue

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

REST remains the authoritative recovery/read path. Realtime does not bypass REST authorization.

## Tourist verification prerequisite

Email OTP itself is handled over REST, not Socket.IO. After successful `POST /api/v1/auth/verify-email`, the issued session/access token can be used for authenticated realtime connections.
