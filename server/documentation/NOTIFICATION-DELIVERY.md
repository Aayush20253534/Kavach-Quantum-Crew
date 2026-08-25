# Notification Delivery

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


> Tourist signup OTP email is **not** a `NotificationDelivery` job. Account verification uses the dedicated Gmail mailer in the auth module so verification can happen before the tourist has a normal authenticated session.


`Notification` is the application message. `NotificationDelivery` is the operational delivery attempt.

```text
Notification
   -> NotificationDelivery
       -> NotificationDeliveryAttempt
```

Channels:
- `IN_APP`
- `EMAIL`
- `SMS`
- `PUSH`
- `WHATSAPP`

Statuses:
- `PENDING`
- `SENDING`
- `SENT`
- `FAILED`
- `RETRY_SCHEDULED`

Retryable failures schedule bounded retry attempts. Attempt history is preserved rather than overwritten.

External destination data is resolved from the target account at processing time instead of duplicating permanent copies into delivery jobs.

A concrete external provider should perform one vendor call, return normalized external identifiers, classify failure as retryable/terminal, and never leak provider secrets.

## Emergency dispatch notifications

Realtime service assignment/tracking uses Socket.IO `dispatch:updated` events. Existing durable notification delivery remains available for future assignment alerts by SMS/email/push; this backend change does not duplicate the notification-delivery subsystem.

## Emergency operational email notifications

Critical operational events use the existing Brevo transactional-email configuration in addition to database and Socket.IO notifications.

### New incident / SOS -> Disaster Management

When `notificationService.incidentCreated()` runs, all active Disaster Managers receive an email containing the incident severity, available coordinates, and a login-aware incident deep link. This covers SOS and other incident creation paths that enter the central incident queue.

### Dispatch assignment -> Police / Ambulance / Fire

When a dispatch reaches `ASSIGNED`, the registered email of the selected emergency-service fleet receives an email. The same behavior is used for automatic nearest assignment and manual Disaster Management assignment.

Email delivery is best-effort. A Brevo outage must never undo a persisted SOS or dispatch; failures are logged for operations while realtime/in-app notification remains available.

## Current notification routing rules

| Trigger | Tourist/member | Group leader | Disaster Management | Police/Fire/Ambulance |
|---|---|---|---|---|
| Danger-zone entry | app + email | as applicable | app + email | **none** |
| Initial group-member signal loss | member context as applicable | app + email | app + email | **none** |
| Leader confirms danger / 5-min timeout | incident path | app state | escalated incident | **none until dispatch** |
| Member remains offline for 1 hour | context/reminder | app + email, new 5-min window | case remains visible | **none until dispatch** |
| Disaster Management assigns responder | incident tracking | incident tracking | realtime/app | app/realtime + email |

Email-provider failure never rolls back persisted safety/dispatch state.
