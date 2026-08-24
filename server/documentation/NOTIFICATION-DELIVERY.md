# Notification Delivery

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
