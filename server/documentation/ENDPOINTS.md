# REST API Endpoint Reference

> Generated from the current Express route modules on **29 August 2026**. Base API prefix is `/api/v1` unless a root health alias is shown. This document is a navigation/reference catalogue; request/response schemas remain defined by each module's Zod validation, controller/service code, and `server/openapi.yaml` where covered.

## Request contract conventions

- Authentication uses the access JWT accepted by `authenticate.middleware.js`.
- Role restrictions use `authorize(...)` and are additionally reinforced by service-level ownership/state checks.
- JSON responses use the common `ApiResponse` envelope.
- Errors flow through `ApiError`/`errorHandler.middleware.js` with a stable `error.code` where the domain defines one.
- Mutation routes validate bodies/params with Zod before the controller runs.
- `/api/v1` is protected by global privacy/security middleware and Express rate limiters.
- Realtime Socket.IO events are documented separately in `REALTIME-EVENTS.md`.

## Important lifecycle endpoints

### Trip planning

- `POST /api/v1/trips/ai-plan` generates a plan through the FastAPI service without asking the browser to call Python directly.
- `POST /api/v1/trips/:tripId/ai-plan` attaches accepted AI output to an existing **PLANNED** trip owned by the tourist.
- `POST /api/v1/trips/:tripId/start` transitions the trip into active operation; AI planning is not available after this boundary.

### Group lock

- `POST /api/v1/groups/:groupId/lock` locks membership after the leader has finalized the group. Later joins/invitations/approvals are rejected by backend rules.

### Emergency fleet

- `/api/v1/dispatch/*` is the Disaster Management dispatch domain.
- `/api/v1/emergency-services/*` is the fleet account/field-response domain, including live unit location and dispatch transitions.

## Full route catalogue

## Health
| Method | Endpoint |
|---|---|
| `GET` | `/health` and `/api/v1/health` |
| `GET` | `/health/live` and `/api/v1/health/live` |
| `GET` | `/health/ready` and `/api/v1/health/ready` |
| `GET` | `/health/readiness` and `/api/v1/health/readiness` |
| `GET` | `/health/database` and `/api/v1/health/database` |

## Auth
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/auth/username-availability` |
| `POST` | `/api/v1/auth/register` |
| `POST` | `/api/v1/auth/verify-email` |
| `POST` | `/api/v1/auth/resend-verification` |
| `POST` | `/api/v1/auth/password-reset/request` |
| `POST` | `/api/v1/auth/password-reset/verify` |
| `POST` | `/api/v1/auth/password-reset/reset` |
| `POST` | `/api/v1/auth/login` |
| `POST` | `/api/v1/auth/refresh` |
| `POST` | `/api/v1/auth/logout` |
| `GET` | `/api/v1/auth/me` |

## Tourist
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/tourists/me` |
| `POST` | `/api/v1/tourists/me/onboarding` |
| `PATCH` | `/api/v1/tourists/me` |
| `POST` | `/api/v1/tourists/me/medical-document` |
| `POST` | `/api/v1/tourists/me/profile-image` |

## Trip
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/trips` |
| `POST` | `/api/v1/trips/ai-plan` |
| `GET` | `/api/v1/trips/current` |
| `GET` | `/api/v1/trips/history` |
| `POST` | `/api/v1/trips/:tripId/ai-plan` |
| `GET` | `/api/v1/trips/:tripId` |
| `POST` | `/api/v1/trips/:tripId/consents` |
| `DELETE` | `/api/v1/trips/:tripId/consents/:consentId` |
| `POST` | `/api/v1/trips/:tripId/safety-id` |
| `POST` | `/api/v1/trips/:tripId/start` |
| `POST` | `/api/v1/trips/:tripId/extend` |
| `POST` | `/api/v1/trips/:tripId/complete` |
| `POST` | `/api/v1/trips/:tripId/cancel` |

## Group
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/groups/trips/:tripId` |
| `GET` | `/api/v1/groups/trips/:tripId` |
| `POST` | `/api/v1/groups/join/preview` |
| `POST` | `/api/v1/groups/join/qr/preview` |
| `POST` | `/api/v1/groups/join` |
| `POST` | `/api/v1/groups/join/qr` |
| `GET` | `/api/v1/groups/join/requests/:requestId` |
| `GET` | `/api/v1/groups/:groupId/join-requests` |
| `POST` | `/api/v1/groups/:groupId/join-requests/:requestId/approve` |
| `POST` | `/api/v1/groups/:groupId/join-requests/:requestId/reject` |
| `POST` | `/api/v1/groups/:groupId/lock` |
| `GET` | `/api/v1/groups/:groupId` |
| `POST` | `/api/v1/groups/:groupId/invitations` |
| `DELETE` | `/api/v1/groups/:groupId/invitations/:invitationId` |
| `POST` | `/api/v1/groups/:groupId/leave` |
| `DELETE` | `/api/v1/groups/:groupId/members/:memberId` |

## Credential
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/credentials/verify/:token` |
| `GET` | `/api/v1/credentials/trips/:tripId/me` |
| `GET` | `/api/v1/credentials/groups/:groupId` |

## Tracking
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/tracking/consent/:tripId` |
| `DELETE` | `/api/v1/tracking/consent/:tripId` |
| `POST` | `/api/v1/tracking/pings` |
| `GET` | `/api/v1/tracking/latest` |
| `GET` | `/api/v1/tracking/groups/:groupId` |

## Safety
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/safety/zones` |
| `POST` | `/api/v1/safety/zones` |
| `POST` | `/api/v1/safety/trips/:tripId/check-ins` |
| `GET` | `/api/v1/safety/trips/:tripId/check-ins` |
| `POST` | `/api/v1/safety/check-ins/:checkInId/complete` |
| `GET` | `/api/v1/safety/trips/:tripId/risk` |
| `GET` | `/api/v1/safety/trips/:tripId/alerts` |
| `POST` | `/api/v1/safety/alerts/:alertId/acknowledge` |

## Signal Loss
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/signal-loss-cases` |
| `GET` | `/api/v1/signal-loss-cases/group-separation?tripId=:tripId` |
| `POST` | `/api/v1/signal-loss-cases/group-separation/:alertId/respond` |
| `POST` | `/api/v1/signal-loss-cases/:caseId/respond` |

## Alert
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/alerts` |
| `GET` | `/api/v1/alerts/:alertId` |
| `POST` | `/api/v1/alerts/:alertId/acknowledge` |
| `POST` | `/api/v1/alerts/:alertId/resolve` |

## Sos
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/sos` |
| `GET` | `/api/v1/sos/:sosId` |

## Incident
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/incidents/mine` |
| `GET` | `/api/v1/incidents/queue` |
| `GET` | `/api/v1/incidents/:incidentId/messages` |
| `POST` | `/api/v1/incidents/:incidentId/messages` |
| `GET` | `/api/v1/incidents/:incidentId` |
| `POST` | `/api/v1/incidents/:incidentId/acknowledge` |
| `POST` | `/api/v1/incidents/:incidentId/start` |
| `POST` | `/api/v1/incidents/:incidentId/resolve` |
| `POST` | `/api/v1/incidents/:incidentId/dismiss` |
| `POST` | `/api/v1/incidents/:incidentId/assign` |
| `POST` | `/api/v1/incidents/:incidentId/unassign` |
| `POST` | `/api/v1/incidents/:incidentId/notes` |

## Disaster Management
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/disaster-management/dashboard` |
| `GET` | `/api/v1/disaster-management/jurisdiction-overview` |
| `GET` | `/api/v1/disaster-management/responders` |
| `GET` | `/api/v1/disaster-management/responders/me` |
| `PATCH` | `/api/v1/disaster-management/responders/me/status` |
| `GET` | `/api/v1/disaster-management/responders/me/incidents` |
| `GET` | `/api/v1/disaster-management/responders/:responderId` |
| `GET` | `/api/v1/disaster-management/incidents` |
| `GET` | `/api/v1/disaster-management/incidents/:incidentId` |
| `POST` | `/api/v1/disaster-management/incidents/:incidentId/acknowledge` |
| `POST` | `/api/v1/disaster-management/incidents/:incidentId/start` |
| `POST` | `/api/v1/disaster-management/incidents/:incidentId/resolve` |

## Notification
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/notifications` |
| `GET` | `/api/v1/notifications/unread-count` |
| `PATCH` | `/api/v1/notifications/read-all` |
| `PATCH` | `/api/v1/notifications/:notificationId/read` |

## Notification Delivery
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/notification-deliveries/capabilities` |
| `GET` | `/api/v1/notification-deliveries/` |
| `POST` | `/api/v1/notification-deliveries/notifications/:notificationId` |
| `POST` | `/api/v1/notification-deliveries/process-due` |
| `GET` | `/api/v1/notification-deliveries/:deliveryId` |
| `POST` | `/api/v1/notification-deliveries/:deliveryId/retry` |

## Escalation
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/escalations/run` |

## Hazard
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/hazards` |
| `GET` | `/api/v1/hazards` |
| `GET` | `/api/v1/hazards/nearby` |
| `GET` | `/api/v1/hazards/:hazardId` |
| `PATCH` | `/api/v1/hazards/:hazardId/verify` |
| `PATCH` | `/api/v1/hazards/:hazardId/reject` |
| `PATCH` | `/api/v1/hazards/:hazardId/resolve` |

## Risk Zone
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/risk-zones` |
| `POST` | `/api/v1/risk-zones/evaluate` |
| `POST` | `/api/v1/risk-zones` |
| `GET` | `/api/v1/risk-zones/:zoneId` |
| `PATCH` | `/api/v1/risk-zones/:zoneId` |
| `POST` | `/api/v1/risk-zones/:zoneId/activate` |
| `POST` | `/api/v1/risk-zones/:zoneId/deactivate` |

## Monitoring
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/monitoring/trips/:tripId/policy` |
| `PATCH` | `/api/v1/monitoring/trips/:tripId/policy` |
| `POST` | `/api/v1/monitoring/trips/:tripId/evaluate` |
| `POST` | `/api/v1/monitoring/sweep` |

## Dispatch
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/dispatch/units` |
| `GET` | `/api/v1/dispatch/active` |
| `POST` | `/api/v1/dispatch/units` |
| `PATCH` | `/api/v1/dispatch/units/:unitId/status` |
| `POST` | `/api/v1/dispatch/incidents/:incidentId/auto/:serviceType` |
| `POST` | `/api/v1/dispatch/incidents/:incidentId` |
| `GET` | `/api/v1/dispatch/incidents/:incidentId` |
| `GET` | `/api/v1/dispatch/:dispatchId` |
| `POST` | `/api/v1/dispatch/:dispatchId/assign` |
| `PATCH` | `/api/v1/dispatch/:dispatchId/status` |

## Emergency Service
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/emergency-services/register` |
| `POST` | `/api/v1/emergency-services/accounts` |
| `GET` | `/api/v1/emergency-services/tracking/:dispatchId` |
| `GET` | `/api/v1/emergency-services/tourist/dispatches` |
| `GET` | `/api/v1/emergency-services/me` |
| `PATCH` | `/api/v1/emergency-services/me/location` |
| `GET` | `/api/v1/emergency-services/me/dispatches` |
| `PATCH` | `/api/v1/emergency-services/dispatches/:dispatchId/location` |
| `PATCH` | `/api/v1/emergency-services/dispatches/:dispatchId/status` |

## Evidence
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/evidence` |
| `GET` | `/api/v1/evidence` |
| `GET` | `/api/v1/evidence/:attachmentId` |
| `GET` | `/api/v1/evidence/:attachmentId/content` |
| `DELETE` | `/api/v1/evidence/:attachmentId` |

## System Admin
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/admin/dashboard` |
| `GET` | `/api/v1/admin/accounts` |
| `GET` | `/api/v1/admin/accounts/:role/:accountId` |
| `PATCH` | `/api/v1/admin/accounts/:role/:accountId/status` |
| `GET` | `/api/v1/admin/destinations` |
| `POST` | `/api/v1/admin/destinations` |
| `PATCH` | `/api/v1/admin/destinations/:destinationId` |
| `DELETE` | `/api/v1/admin/destinations/:destinationId` |
| `POST` | `/api/v1/admin/destinations/:destinationId/image` |
| `GET` | `/api/v1/admin/resources/:resource` |

## Analytics
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/analytics/overview` |
| `GET` | `/api/v1/analytics/incidents` |
| `GET` | `/api/v1/analytics/trips` |
| `GET` | `/api/v1/analytics/hazards` |
| `GET` | `/api/v1/analytics/sos` |
| `GET` | `/api/v1/analytics/dispatch` |
| `GET` | `/api/v1/analytics/responders` |
| `GET` | `/api/v1/analytics/response-times` |

## Chatbot
| Method | Endpoint |
|---|---|
| `POST` | `/api/v1/chatbot/messages` |

## Dashboard
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/dashboard/tourist` |

## Destination
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/destinations` |

## Integrations
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/integrations/capabilities` |
| `POST` | `/api/v1/integrations/ai/risk-assessment` |
| `POST` | `/api/v1/integrations/ai/hazard-analysis` |
| `POST` | `/api/v1/integrations/blockchain/safety-id-proof` |
| `POST` | `/api/v1/integrations/blockchain/incident-proof` |
| `POST` | `/api/v1/integrations/blockchain/evidence-proof` |
| `GET` | `/api/v1/integrations/blockchain/verification/:reference` |

## Audit
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/audit` |
| `GET` | `/api/v1/audit/summary` |

## Observability
| Method | Endpoint |
|---|---|
| `GET` | `/api/v1/observability/metrics` |
| `GET` | `/api/v1/observability/diagnostics` |


## Health aliases

Health is intentionally mounted both at `/health/*` and `/api/v1/health/*` so infrastructure probes do not need to know the API prefix while API clients still get a versioned route.

## Endpoints that should not be response-cached

Do not place generic Redis HTTP-response caching in front of tracking, dispatch, current trip, group join requests, SOS, notifications, incident transitions, or responder location endpoints. These routes expose active operational state and are updated through PostgreSQL + Socket.IO flows.

## Client integration rule

The React client should use `client/src/services/api`/feature service modules rather than scattering hardcoded production URLs through components. Only public base URLs belong in `VITE_*`; provider secrets stay in backend environments.
