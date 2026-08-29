# Current planning/group permissions

For a GROUP trip, the trip owner/group leader is the only user permitted to generate/attach the AI plan. Members may view the saved plan through authorized current-trip access. Group lock is a leader operation. After the trip is ACTIVE, no actor can legitimately attach/replace the AI plan because lifecycle validation rejects it. Emergency fleet roles are restricted to their account/assigned dispatch context; client-side route hiding is never considered authorization.

# Role and Permission Matrix

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


This is a high-level matrix. Ownership, consent, lifecycle, and membership checks can further restrict an allowed role.

| Capability | TOURIST | DISASTER_MANAGER | SYSTEM_ADMIN |
|---|:---:|:---:|:---:|
| Self-register | Yes | No | No |
| Verify signup email with OTP | Yes | No | No |
| Resend own verification OTP | Yes | No | No |
| Login / refresh own account | Yes, after email verification | Yes | Yes |
| Manage own tourist profile | Yes | No | No |
| Create/manage own trip | Yes | No | No |
| Grant/withdraw trip consent | Yes | No | No |
| Issue own trip Safety ID | Yes | No | No |
| Create/join group trip | Yes | No | No |
| Submit consented location | Yes | No | No |
| View authorized group location | Yes | No | No |
| Schedule/complete own check-ins | Yes | No | No |
| View own safety alerts | Yes | No | No |
| Trigger SOS | Yes | No | No |
| View own/group incidents | Yes | No | No |
| View emergency incident queue | No | Yes | Yes |
| Acknowledge/start/resolve incidents | No | Yes | Yes |
| Self-assign incident | No | Yes | Yes |
| Assign another responder | No | No | Yes |
| Add staff incident notes | No | Yes | Yes |
| Incident conversation | Authorized participant | Yes | Yes |
| Report hazard | Yes | No | No |
| Moderate hazards | No | Yes | Yes |
| Manage risk zones | No | Yes | Yes |
| Create emergency units | No | No | Yes |
| Dispatch emergency units | No | Yes | Yes |
| Upload evidence | Authorized target | Yes | Yes |
| Delete evidence | Own upload | Own upload | Yes |
| Read own notifications | Yes | Yes | Yes |
| Enqueue/inspect delivery jobs | No | Yes | Yes |
| Process due delivery queue | No | No | Yes |
| View operational analytics | No | Yes | Yes |
| Use AI/blockchain contracts | No | Yes | Yes |
| Manage account status | No | No | Yes |
| Read audit API | No | No | Yes |
| Read observability API | No | No | Yes |

Authentication alone never grants arbitrary access to another user's resource.

## Email verification rule

`TOURIST` accounts are created unverified. Until `emailVerifiedAt` is populated, normal login/session use and authenticated Socket.IO access are blocked. Staff accounts are not enrolled through the public tourist OTP flow.

## Emergency service roles

`POLICE`, `FIRE`, and `AMBULANCE` are authenticated roles backed by `EmergencyServiceAccount`. These roles may read their profile/assigned dispatches, update their own/current unit location, and advance their own dispatch status. They cannot cancel a dispatch or operate another service's assignment. Disaster Management performs manual or nearest-unit dispatch.

## Current cross-role safety permissions

- **Tourist:** may view responder tracking only for dispatches connected to their own individual/group incident; protected identity fields are not editable while a planned/active trip exists.
- **Group leader (Tourist role):** may list relevant signal-loss cases and submit `FALSE_ALARM` or `CONFIRMED_DANGER`.
- **Disaster Manager:** receives danger/signal-loss incidents and initiates responder dispatch; may view responder tracking.
- **Police / Fire / Ambulance:** operate the single fleet account, view their dispatches, update dispatch status/location, and view authorized live tracking.
- **System Admin:** retains administrative visibility/configuration.

No emergency-service role receives an automatic dispatch merely because a danger-zone or signal-loss event exists.


## Emergency-service account provisioning

- `DISASTER_MANAGER` and `SYSTEM_ADMIN` may create Police, Fire, and Ambulance/Hospital login accounts through `POST /api/v1/emergency-services/accounts`.
- Public users and tourist accounts cannot provision responder accounts.
- Passwords are stored only as password hashes. Newly provisioned units are not eligible for nearest-unit dispatch until a live location has been published.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## 2026-08-27 role sync

Emergency responder access is shared across `POLICE`, `AMBULANCE`, and `FIRE` roles under the responder portal, but each account may act only on dispatches/telemetry authorized for that emergency-service account. Disaster Managers operate incidents and fleet assignment; System Admin governs platform accounts/content/diagnostics; Tourist owns journey/safety actions.

Private chatbot profile context is always limited to the currently authenticated account regardless of role.

---

## Repository synchronization — 2026-08-27

Shared emergency tracking is role-gated: tourists can read tracking for their dispatches, Disaster Manager/System Admin can observe operational response, and police/fire/ambulance responders manage their own dispatch/location/status. Private chatbot enrichment and tourist profile/trip data remain scoped to the authenticated account.
