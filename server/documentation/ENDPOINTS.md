# API Endpoint Catalogue

> Base prefix: `/api/v1` unless explicitly shown otherwise.

This catalogue documents **148 mounted HTTP routes/aliases** in the current backend. Authorization shown here is the effective high-level rule; individual services also enforce ownership, membership, lifecycle, consent, and resource-visibility checks.

## Conventions

- **Public**: no access token is required.
- **Authenticated**: a valid supported account is required.
- **TOURIST / DISASTER_MANAGER / SYSTEM_ADMIN**: role-restricted.
- **owner / participant / member**: authentication alone is insufficient; the service checks the relationship to the resource.
- All protected routes use the common access-token middleware and centralized validation/error normalization.

## API & Health

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/` | Public | Friendly service landing response with API and health entry points. |
| `GET` | `/api/v1` | Public | API discovery document with service/version and major route groups. |
| `GET` | `/health` | Public | Process liveness probe; does not require PostgreSQL. |
| `GET` | `/health/live` | Public | Alias of the liveness probe. |
| `GET` | `/health/ready` | Public | Readiness probe including required dependencies. |
| `GET` | `/health/readiness` | Public | Alias of the readiness probe. |
| `GET` | `/health/database` | Public | Direct PostgreSQL probe with latency. |
| `GET` | `/api/v1/health` | Public | API-prefixed liveness probe. |
| `GET` | `/api/v1/health/live` | Public | API-prefixed liveness alias. |
| `GET` | `/api/v1/health/ready` | Public | API-prefixed readiness probe. |
| `GET` | `/api/v1/health/readiness` | Public | API-prefixed readiness alias. |
| `GET` | `/api/v1/health/database` | Public | API-prefixed PostgreSQL health probe. |

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Create an unverified TOURIST account and send a six-digit email OTP; no normal session is issued yet. |
| `POST` | `/api/v1/auth/verify-email` | Public | Verify the tourist email with the six-digit OTP and issue the initial access/refresh session. |
| `POST` | `/api/v1/auth/resend-verification` | Public | Request a replacement verification OTP subject to cooldown; response is intentionally generic. |
| `POST` | `/api/v1/auth/login` | Public | Authenticate by supported identifier and password; unverified tourists receive `EMAIL_VERIFICATION_REQUIRED`. |
| `POST` | `/api/v1/auth/refresh` | Public / refresh session | Rotate refresh session and issue a new access token. |
| `POST` | `/api/v1/auth/logout` | Refresh session | Revoke the supplied/current refresh session. |
| `GET` | `/api/v1/auth/me` | Authenticated | Return the current account identity. |

## Tourist Profile

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/tourists/me` | TOURIST | Return the authenticated tourist profile. |
| `POST` | `/api/v1/tourists/me/onboarding` | TOURIST | Complete tourist onboarding and safety profile fields. |
| `PATCH` | `/api/v1/tourists/me` | TOURIST | Update supported tourist profile fields. |

## Trips, Consent & Safety ID

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/trips` | TOURIST | Create a planned SOLO or GROUP trip. |
| `GET` | `/api/v1/trips/current` | TOURIST | Return the current planned/active trip. |
| `GET` | `/api/v1/trips/history` | TOURIST | Return paginated completed/cancelled trip history. |
| `GET` | `/api/v1/trips/:tripId` | TOURIST owner | Return an owned trip. |
| `POST` | `/api/v1/trips/:tripId/consents` | TOURIST owner | Grant a supported trip consent. |
| `DELETE` | `/api/v1/trips/:tripId/consents/:consentId` | TOURIST owner | Withdraw a trip consent. |
| `POST` | `/api/v1/trips/:tripId/safety-id` | TOURIST owner | Issue/reissue the trip-scoped Safety ID after required consent. |
| `POST` | `/api/v1/trips/:tripId/start` | TOURIST owner | Start an eligible planned trip. |
| `POST` | `/api/v1/trips/:tripId/complete` | TOURIST owner | Complete an active trip. |
| `POST` | `/api/v1/trips/:tripId/cancel` | TOURIST owner | Cancel an eligible trip. |

## Group Trips

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/groups/trips/:tripId` | Authenticated trip owner | Create a group for an owned GROUP trip. |
| `GET` | `/api/v1/groups/trips/:tripId` | Authorized participant | Return the group associated with a trip. |
| `POST` | `/api/v1/groups/join` | Authenticated | Join a group using an invitation token. |
| `GET` | `/api/v1/groups/:groupId` | Authorized group participant | Return group details. |
| `POST` | `/api/v1/groups/:groupId/invitations` | Group leader | Create an expiring invitation; raw token is returned once. |
| `DELETE` | `/api/v1/groups/:groupId/invitations/:invitationId` | Group leader | Revoke a group invitation. |
| `POST` | `/api/v1/groups/:groupId/leave` | Group member | Leave a group; leaders cannot leave without closing/transferring flow. |
| `DELETE` | `/api/v1/groups/:groupId/members/:memberId` | Group leader | Remove a non-leader member. |

## Tracking & Safety

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/tracking/consent/:tripId` | Authorized trip participant | Grant tracking consent for a trip. |
| `DELETE` | `/api/v1/tracking/consent/:tripId` | Authorized trip participant | Withdraw tracking consent. |
| `POST` | `/api/v1/tracking/pings` | Authorized active participant | Submit a location ping; trusted pings feed safety evaluation. |
| `GET` | `/api/v1/tracking/latest` | Authorized participant | Read latest authorized trip location. |
| `GET` | `/api/v1/tracking/groups/:groupId` | Active group member | Read authorized group-member locations. |
| `GET` | `/api/v1/safety/zones` | Authenticated | List applicable legacy safety zones. |
| `POST` | `/api/v1/safety/zones` | DISASTER_MANAGER / SYSTEM_ADMIN | Create a safety zone. |
| `POST` | `/api/v1/safety/trips/:tripId/check-ins` | TOURIST owner | Schedule a trip safety check-in. |
| `GET` | `/api/v1/safety/trips/:tripId/check-ins` | TOURIST owner | List trip check-ins. |
| `POST` | `/api/v1/safety/check-ins/:checkInId/complete` | TOURIST | Complete a scheduled check-in. |
| `GET` | `/api/v1/safety/trips/:tripId/risk` | TOURIST owner | Return current deterministic trip risk evaluation. |
| `GET` | `/api/v1/safety/trips/:tripId/alerts` | TOURIST owner | List trip safety alerts. |
| `POST` | `/api/v1/safety/alerts/:alertId/acknowledge` | TOURIST owner | Acknowledge a safety alert. |

## Alerts & SOS

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/alerts` | TOURIST | List the tourist's safety alerts. |
| `GET` | `/api/v1/alerts/:alertId` | TOURIST owner | Read an owned safety alert. |
| `POST` | `/api/v1/alerts/:alertId/acknowledge` | TOURIST owner | Acknowledge an owned alert. |
| `POST` | `/api/v1/alerts/:alertId/resolve` | TOURIST owner | Resolve an owned alert. |
| `POST` | `/api/v1/sos` | TOURIST | Trigger a CRITICAL SOS for an active trip. |
| `GET` | `/api/v1/sos/:sosId` | Authorized participant/staff | Read an SOS when access rules permit. |

## Incidents & Communication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/incidents/mine` | TOURIST | List incidents visible to the tourist or active group membership. |
| `GET` | `/api/v1/incidents/queue` | DISASTER_MANAGER / SYSTEM_ADMIN | List emergency incident queue. |
| `GET` | `/api/v1/incidents/:incidentId/messages` | Authorized incident participant/staff | Read paginated incident conversation history. |
| `POST` | `/api/v1/incidents/:incidentId/messages` | Authorized incident participant/staff | Send an incident message while the incident accepts messages. |
| `GET` | `/api/v1/incidents/:incidentId` | Authorized participant/staff | Read incident details and allowed related state. |
| `POST` | `/api/v1/incidents/:incidentId/acknowledge` | DISASTER_MANAGER / SYSTEM_ADMIN | Acknowledge an incident. |
| `POST` | `/api/v1/incidents/:incidentId/start` | DISASTER_MANAGER / SYSTEM_ADMIN | Start active response. |
| `POST` | `/api/v1/incidents/:incidentId/resolve` | DISASTER_MANAGER / SYSTEM_ADMIN | Resolve an incident with resolution data. |
| `POST` | `/api/v1/incidents/:incidentId/dismiss` | DISASTER_MANAGER / SYSTEM_ADMIN | Dismiss a false-positive/non-actionable incident. |
| `POST` | `/api/v1/incidents/:incidentId/assign` | DISASTER_MANAGER / SYSTEM_ADMIN | Assign a responder; disaster managers can only self-assign. |
| `POST` | `/api/v1/incidents/:incidentId/unassign` | Assigned DISASTER_MANAGER / SYSTEM_ADMIN | Remove an incident assignment. |
| `POST` | `/api/v1/incidents/:incidentId/notes` | DISASTER_MANAGER / SYSTEM_ADMIN | Add staff-only operational notes. |

## Disaster Management

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/disaster-management/dashboard` | DISASTER_MANAGER / SYSTEM_ADMIN | Operational response dashboard. |
| `GET` | `/api/v1/disaster-management/responders` | DISASTER_MANAGER / SYSTEM_ADMIN | List responders with status/workload. |
| `GET` | `/api/v1/disaster-management/responders/me` | DISASTER_MANAGER | Return own responder profile and workload. |
| `PATCH` | `/api/v1/disaster-management/responders/me/status` | DISASTER_MANAGER | Set responder availability status. |
| `GET` | `/api/v1/disaster-management/responders/me/incidents` | DISASTER_MANAGER | List incidents assigned to the current responder. |
| `GET` | `/api/v1/disaster-management/responders/:responderId` | DISASTER_MANAGER / SYSTEM_ADMIN | Inspect responder workload/capacity. |
| `GET` | `/api/v1/disaster-management/incidents` | DISASTER_MANAGER / SYSTEM_ADMIN | Operational incident queue with scope filters. |
| `GET` | `/api/v1/disaster-management/incidents/:incidentId` | DISASTER_MANAGER / SYSTEM_ADMIN | Read incident operational details. |
| `POST` | `/api/v1/disaster-management/incidents/:incidentId/acknowledge` | DISASTER_MANAGER / SYSTEM_ADMIN | Acknowledge an incident. |
| `POST` | `/api/v1/disaster-management/incidents/:incidentId/start` | DISASTER_MANAGER / SYSTEM_ADMIN | Start incident response. |
| `POST` | `/api/v1/disaster-management/incidents/:incidentId/resolve` | DISASTER_MANAGER / SYSTEM_ADMIN | Resolve an incident. |

## Notifications & Escalation

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Authenticated owner | List notifications targeted to the current account. |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated owner | Return unread notification count. |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated owner | Mark all own notifications as read. |
| `PATCH` | `/api/v1/notifications/:notificationId/read` | Authenticated owner | Mark one own notification as read. |
| `POST` | `/api/v1/escalations/run` | SYSTEM_ADMIN | Run the scheduler-ready overdue incident escalation sweep. |

## Notification Delivery

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/notification-deliveries/capabilities` | DISASTER_MANAGER / SYSTEM_ADMIN | Return supported delivery channels/provider capabilities. |
| `GET` | `/api/v1/notification-deliveries` | DISASTER_MANAGER / SYSTEM_ADMIN | List delivery jobs using filters. |
| `POST` | `/api/v1/notification-deliveries/notifications/:notificationId` | DISASTER_MANAGER / SYSTEM_ADMIN | Create delivery jobs for selected channels. |
| `POST` | `/api/v1/notification-deliveries/process-due` | SYSTEM_ADMIN | Process due/retryable delivery jobs. |
| `GET` | `/api/v1/notification-deliveries/:deliveryId` | DISASTER_MANAGER / SYSTEM_ADMIN | Inspect a delivery and its attempt history. |
| `POST` | `/api/v1/notification-deliveries/:deliveryId/retry` | DISASTER_MANAGER / SYSTEM_ADMIN | Manually retry an eligible delivery. |

## Hazards

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/hazards` | TOURIST | Report a hazard. |
| `GET` | `/api/v1/hazards` | TOURIST / DISASTER_MANAGER / SYSTEM_ADMIN | List hazards using visibility rules. |
| `GET` | `/api/v1/hazards/nearby` | TOURIST / DISASTER_MANAGER / SYSTEM_ADMIN | Find verified nearby hazards. |
| `GET` | `/api/v1/hazards/:hazardId` | TOURIST / DISASTER_MANAGER / SYSTEM_ADMIN | Read a hazard subject to visibility rules. |
| `PATCH` | `/api/v1/hazards/:hazardId/verify` | DISASTER_MANAGER / SYSTEM_ADMIN | Verify a pending hazard. |
| `PATCH` | `/api/v1/hazards/:hazardId/reject` | DISASTER_MANAGER / SYSTEM_ADMIN | Reject a pending hazard. |
| `PATCH` | `/api/v1/hazards/:hazardId/resolve` | DISASTER_MANAGER / SYSTEM_ADMIN | Resolve a verified hazard. |

## Risk Zones & Monitoring

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/risk-zones` | TOURIST / DISASTER_MANAGER / SYSTEM_ADMIN | List risk/safe zones with visibility/effective filters. |
| `POST` | `/api/v1/risk-zones/evaluate` | TOURIST / DISASTER_MANAGER / SYSTEM_ADMIN | Evaluate a coordinate against active zones. |
| `POST` | `/api/v1/risk-zones` | DISASTER_MANAGER / SYSTEM_ADMIN | Create a circle or polygon risk/safe zone. |
| `GET` | `/api/v1/risk-zones/:zoneId` | TOURIST / DISASTER_MANAGER / SYSTEM_ADMIN | Read an authorized zone. |
| `PATCH` | `/api/v1/risk-zones/:zoneId` | DISASTER_MANAGER / SYSTEM_ADMIN | Update a zone. |
| `POST` | `/api/v1/risk-zones/:zoneId/activate` | DISASTER_MANAGER / SYSTEM_ADMIN | Activate a zone. |
| `POST` | `/api/v1/risk-zones/:zoneId/deactivate` | DISASTER_MANAGER / SYSTEM_ADMIN | Deactivate a zone. |
| `GET` | `/api/v1/monitoring/trips/:tripId/policy` | Authorized trip participant/staff | Read advanced monitoring policy. |
| `PATCH` | `/api/v1/monitoring/trips/:tripId/policy` | Authorized trip owner/staff | Update monitoring thresholds/route. |
| `POST` | `/api/v1/monitoring/trips/:tripId/evaluate` | TOURIST owner | Run deterministic advanced monitoring for a trip. |
| `POST` | `/api/v1/monitoring/sweep` | SYSTEM_ADMIN | Evaluate active trips in a scheduler-ready sweep. |

## Emergency Dispatch

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/dispatch/units` | DISASTER_MANAGER / SYSTEM_ADMIN | List emergency units. |
| `POST` | `/api/v1/dispatch/units` | SYSTEM_ADMIN | Create an emergency unit. |
| `PATCH` | `/api/v1/dispatch/units/:unitId/status` | SYSTEM_ADMIN | Change emergency-unit availability/status. |
| `POST` | `/api/v1/dispatch/incidents/:incidentId` | DISASTER_MANAGER / SYSTEM_ADMIN | Create an incident dispatch request. |
| `GET` | `/api/v1/dispatch/incidents/:incidentId` | DISASTER_MANAGER / SYSTEM_ADMIN | List dispatches for an incident. |
| `GET` | `/api/v1/dispatch/:dispatchId` | DISASTER_MANAGER / SYSTEM_ADMIN | Read a dispatch. |
| `POST` | `/api/v1/dispatch/:dispatchId/assign` | DISASTER_MANAGER / SYSTEM_ADMIN | Assign an available matching unit. |
| `PATCH` | `/api/v1/dispatch/:dispatchId/status` | DISASTER_MANAGER / SYSTEM_ADMIN | Advance/cancel dispatch lifecycle. |

## Evidence

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/evidence` | Authorized incident/hazard participant/staff | Upload one multipart evidence file linked to an incident or hazard. |
| `GET` | `/api/v1/evidence` | Authorized participant/staff | List evidence for an authorized target. |
| `GET` | `/api/v1/evidence/:attachmentId` | Authorized participant/staff | Read evidence metadata. |
| `GET` | `/api/v1/evidence/:attachmentId/content` | Authorized participant/staff | Download evidence bytes after authorization. |
| `DELETE` | `/api/v1/evidence/:attachmentId` | Uploader / SYSTEM_ADMIN | Delete an evidence attachment. |

## System Administration

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | SYSTEM_ADMIN | Platform-wide administrative summary. |
| `GET` | `/api/v1/admin/accounts` | SYSTEM_ADMIN | Search/list safe account views. |
| `GET` | `/api/v1/admin/accounts/:role/:accountId` | SYSTEM_ADMIN | Inspect one account without password hashes. |
| `PATCH` | `/api/v1/admin/accounts/:role/:accountId/status` | SYSTEM_ADMIN | Activate, suspend, or disable an account and revoke sessions when needed. |
| `GET` | `/api/v1/admin/resources/:resource` | SYSTEM_ADMIN | Read operational resources across supported domains. |

## Analytics

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/analytics/overview` | DISASTER_MANAGER / SYSTEM_ADMIN | Platform operational overview. |
| `GET` | `/api/v1/analytics/incidents` | DISASTER_MANAGER / SYSTEM_ADMIN | Incident breakdown and timing aggregates. |
| `GET` | `/api/v1/analytics/trips` | DISASTER_MANAGER / SYSTEM_ADMIN | Trip analytics. |
| `GET` | `/api/v1/analytics/hazards` | DISASTER_MANAGER / SYSTEM_ADMIN | Hazard analytics. |
| `GET` | `/api/v1/analytics/sos` | DISASTER_MANAGER / SYSTEM_ADMIN | SOS analytics. |
| `GET` | `/api/v1/analytics/dispatch` | DISASTER_MANAGER / SYSTEM_ADMIN | Dispatch status/unit/timing analytics. |
| `GET` | `/api/v1/analytics/responders` | DISASTER_MANAGER / SYSTEM_ADMIN | Responder workload analytics. |
| `GET` | `/api/v1/analytics/response-times` | DISASTER_MANAGER / SYSTEM_ADMIN | Consolidated incident and dispatch response-time metrics. |

## AI & Blockchain Integration Contracts

### Chatbot availability

There is currently **no tourist chatbot REST endpoint**. `ChatbotWidget.jsx` is simulated in the browser. The `/integrations/ai/*` routes below are staff-only analysis contracts for `DISASTER_MANAGER` and `SYSTEM_ADMIN`; they are not conversational chatbot APIs and return `501 INTEGRATION_PROVIDER_NOT_CONFIGURED` until a provider is injected.


| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/integrations/capabilities` | DISASTER_MANAGER / SYSTEM_ADMIN | Return available AI/blockchain integration contract capabilities. |
| `POST` | `/api/v1/integrations/ai/risk-assessment` | DISASTER_MANAGER / SYSTEM_ADMIN | Forward validated trip/location context to an injected AI risk provider. |
| `POST` | `/api/v1/integrations/ai/hazard-analysis` | DISASTER_MANAGER / SYSTEM_ADMIN | Forward validated hazard context to an injected AI hazard provider. |
| `POST` | `/api/v1/integrations/blockchain/safety-id-proof` | DISASTER_MANAGER / SYSTEM_ADMIN | Forward a Safety ID proof payload to an injected blockchain provider. |
| `POST` | `/api/v1/integrations/blockchain/incident-proof` | DISASTER_MANAGER / SYSTEM_ADMIN | Forward an incident proof payload to an injected blockchain provider. |
| `POST` | `/api/v1/integrations/blockchain/evidence-proof` | DISASTER_MANAGER / SYSTEM_ADMIN | Forward an evidence proof payload to an injected blockchain provider. |
| `GET` | `/api/v1/integrations/blockchain/verification/:reference` | DISASTER_MANAGER / SYSTEM_ADMIN | Ask the blockchain provider to verify a previously issued reference. |

## Audit & Observability

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/audit` | SYSTEM_ADMIN | Query audit events by actor/action/entity/date filters. |
| `GET` | `/api/v1/audit/summary` | SYSTEM_ADMIN | Return audit action summaries for a time range. |
| `GET` | `/api/v1/observability/metrics` | SYSTEM_ADMIN | Read in-process HTTP operational metrics. |
| `GET` | `/api/v1/observability/diagnostics` | SYSTEM_ADMIN | Read safe process/memory/database diagnostics. |

## Tourist Email Verification

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/verify-email` | Public verification flow | Verify a newly registered tourist using email + 6-digit OTP; successful verification creates the authenticated session. |
| `POST` | `/api/v1/auth/resend-verification` | Public verification flow | Generate and email a replacement OTP subject to resend cooldown. |


## Tourist chatbot

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/chatbot/messages` | `TOURIST` | Validate a tourist chatbot message and forward it through the pluggable chatbot AI provider boundary. |

Request body: `message` (required), optional `conversationId`, optional `location { latitude, longitude }`, and optional `context`. The default provider returns `501 CHATBOT_PROVIDER_NOT_CONFIGURED` until the AI branch supplies the provider implementation.

## Tourist dashboard and destinations

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/tourist?latitude=&longitude=` | TOURIST | Dashboard summary: total tourist users, the caller's active alerts, binary safe/danger geofence status, current group size and current trip. |
| `GET` | `/api/v1/destinations?search=&featured=&limit=` | TOURIST | Search/list configured destinations used by the dashboard and trip/group creation UI. |

Dashboard safety status is `DANGER` only when the supplied point falls inside an active `RISK` safety zone. Otherwise it is `SAFE`. Risk-zone mutation endpoints are restricted to `SYSTEM_ADMIN`; tourists and disaster managers retain read/evaluate access.
