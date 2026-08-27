# Error Catalogue

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Standard error envelope

```json
{
  "success": false,
  "error": {
    "code": "DOMAIN_ERROR_CODE",
    "message": "Safe client-facing message"
  },
  "requestId": "correlation-id",
  "timestamp": "ISO-8601"
}
```

## Important codes

| Code | Meaning |
|---|---|
| `INVALID_ACCESS_TOKEN` | Invalid/expired/malformed token or unsupported role. |
| `EMAIL_VERIFICATION_REQUIRED` | Tourist credentials are valid but the current email has not been verified. |
| `EMAIL_OTP_INVALID` | OTP is wrong, missing from active state, or intentionally returned generically. |
| `EMAIL_OTP_EXPIRED` | Active verification OTP expired. |
| `EMAIL_OTP_ATTEMPTS_EXCEEDED` | Maximum invalid OTP attempts were reached. |
| `EMAIL_ALREADY_VERIFIED` | Verification was requested for an already verified email. |
| `EMAIL_PROVIDER_NOT_CONFIGURED` | Mail provider configuration is unavailable. |
| `EMAIL_DELIVERY_FAILED` | Gmail SMTP delivery failed. |
| `REQUEST_KEY_FORBIDDEN` | Forbidden prototype-pollution-shaped key. |
| `REQUEST_STRUCTURE_TOO_DEEP` | Request nesting exceeds configured maximum. |
| `REQUEST_STRUCTURE_TOO_LARGE` | Request contains too many fields. |
| `INTEGRATION_PROVIDER_NOT_CONFIGURED` | AI/blockchain provider is absent. |
| `DELIVERY_PROVIDER_NOT_CONFIGURED` | External notification provider is absent. |
| `INCIDENT_CLOSED` | Operation is invalid for a closed incident. |
| `RESPONDER_NOT_AVAILABLE` | Responder is not available. |
| `RESPONDER_AT_CAPACITY` | Responder reached active-incident capacity. |
| `RISK_ZONE_NOT_FOUND` | Risk zone unavailable/not visible. |

## Explicit domain codes present in source

- `ACCESS_TOKEN_REQUIRED`
- `ACCOUNT_ALREADY_EXISTS`
- `ACCOUNT_INACTIVE`
- `ACCOUNT_NOT_FOUND`
- `ADMIN_ACCOUNT_NOT_FOUND`
- `ADMIN_SELF_DEACTIVATION_FORBIDDEN`
- `ANALYTICS_ACCESS_FORBIDDEN`
- `ATTACHMENT_NOT_FOUND`
- `AUDIT_ACCESS_FORBIDDEN`
- `AUTHENTICATION_REQUIRED`
- `BAD_REQUEST`
- `CHECK_IN_NOT_FOUND`
- `CHECK_IN_NOT_PENDING`
- `CHECK_IN_TIME_INVALID`
- `CONFLICT`
- `CONSENT_NOT_FOUND`
- `CORS_ORIGIN_DENIED`
- `CURRENT_TRIP_EXISTS`
- `DELIVERY_PROVIDER_NOT_CONFIGURED`
- `DISPATCH_ALREADY_ASSIGNED`
- `DISPATCH_CLOSED`
- `DISPATCH_FORBIDDEN`
- `DISPATCH_INVALID_TRANSITION`
- `DISPATCH_NOT_FOUND`
- `DISPATCH_UNIT_REQUIRED`
- `EMAIL_ALREADY_EXISTS`
- `EMERGENCY_UNIT_ACTIVE`
- `EMERGENCY_UNIT_NOT_FOUND`
- `EMERGENCY_UNIT_TYPE_MISMATCH`
- `EMERGENCY_UNIT_UNAVAILABLE`
- `EVIDENCE_DELETE_FORBIDDEN`
- `EVIDENCE_FILE_REQUIRED`
- `FORBIDDEN`
- `GROUP_ALREADY_EXISTS`
- `GROUP_CLOSED`
- `GROUP_ID_REQUIRED`
- `GROUP_LEADER_REQUIRED`
- `GROUP_MEMBERSHIP_REQUIRED`
- `GROUP_MEMBER_EXISTS`
- `GROUP_MEMBER_NOT_FOUND`
- `GROUP_NOT_FOUND`
- `GROUP_TRIP_REQUIRED`
- `HAZARD_EVIDENCE_CLOSED`
- `HAZARD_MODERATION_FORBIDDEN`
- `HAZARD_NOT_FOUND`
- `HAZARD_REPORT_FORBIDDEN`
- `HAZARD_SCOPE_INVALID`
- `HAZARD_STATE_CONFLICT`
- `INCIDENT_ASSIGN_OTHER_FORBIDDEN`
- `INCIDENT_CLOSED`
- `INCIDENT_COMMUNICATION_CLOSED`
- `INCIDENT_DISMISSED`
- `INCIDENT_EVIDENCE_CLOSED`
- `INCIDENT_ID_REQUIRED`
- `INCIDENT_INVALID_TRANSITION`
- `INCIDENT_NOT_FOUND`
- `INCIDENT_RESOLVED`
- `INCIDENT_SCOPE_INVALID`
- `INCIDENT_SUBSCRIPTION_FAILED`
- `INCIDENT_SUBSCRIPTION_FORBIDDEN`
- `INCIDENT_UNASSIGN_OTHER_FORBIDDEN`
- `INTEGRATION_ACCESS_FORBIDDEN`
- `INTEGRATION_PROVIDER_NOT_CONFIGURED`
- `INTERNAL_SERVER_ERROR`
- `INVALID_ACCESS_TOKEN`
- `INVALID_CREDENTIALS`
- `INVALID_REFRESH_TOKEN`
- `INVITATION_EXPIRED`
- `INVITATION_NOT_FOUND`
- `INVITATION_REVOKED`
- `LEADER_CANNOT_BE_REMOVED`
- `LEADER_CANNOT_LEAVE`
- `LOCATION_ACCURACY_TOO_LOW`
- `LOCATION_DUPLICATE`
- `LOCATION_FUTURE_TIMESTAMP`
- `LOCATION_IMPOSSIBLE_JUMP`
- `LOCATION_IMPOSSIBLE_SPEED`
- `LOCATION_OUT_OF_ORDER`
- `LOCATION_RATE_LIMITED`
- `LOCATION_STALE`
- `LOCATION_TRACKING_CONSENT_REQUIRED`
- `MALFORMED_JSON`
- `MONITORING_FORBIDDEN`
- `MONITORING_POLICY_FORBIDDEN`
- `MONITORING_SWEEP_FORBIDDEN`
- `NOTIFICATION_DELIVERY_FORBIDDEN`
- `NOTIFICATION_DELIVERY_NOT_FOUND`
- `NOTIFICATION_DELIVERY_PROCESS_FORBIDDEN`
- `NOTIFICATION_DELIVERY_RETRY_INVALID`
- `NOTIFICATION_NOT_FOUND`
- `NOT_FOUND`
- `OBSERVABILITY_ACCESS_FORBIDDEN`
- `ONBOARDING_ALREADY_COMPLETED`
- `ONBOARDING_REQUIRED`
- `PAYLOAD_TOO_LARGE`
- `PHONE_ALREADY_EXISTS`
- `RATE_LIMIT_EXCEEDED`
- `RECORD_NOT_FOUND`
- `REFRESH_SESSION_INVALID`
- `REFRESH_TOKEN_REQUIRED`
- `REQUEST_KEY_FORBIDDEN`
- `REQUEST_STRUCTURE_TOO_DEEP`
- `REQUEST_STRUCTURE_TOO_LARGE`
- `RESPONDER_ASSIGNMENTS_FORBIDDEN`
- `RESPONDER_AT_CAPACITY`
- `RESPONDER_NOT_AVAILABLE`
- `RESPONDER_NOT_FOUND`
- `RESPONDER_PROFILE_FORBIDDEN`
- `RESPONDER_STATUS_FORBIDDEN`
- `RISK_ZONE_GEOMETRY_INVALID`
- `RISK_ZONE_MANAGE_FORBIDDEN`
- `RISK_ZONE_NOT_FOUND`
- `RISK_ZONE_WINDOW_INVALID`
- `ROLE_FORBIDDEN`
- `ROUTE_NOT_FOUND`
- `SAFETY_ALERT_NOT_FOUND`
- `SAFETY_ALERT_RESOLVED`
- `SAFETY_ID_REQUIRED`
- `SERVICE_UNAVAILABLE`
- `SOCKET_AUTH_REQUIRED`
- `SOS_ALREADY_ACTIVE`
- `SOS_NOT_FOUND`
- `SOS_TRIP_NOT_ACTIVE`
- `SYSTEM_ADMIN_REQUIRED`
- `TOURIST_NOT_FOUND`
- `TRACKING_CONSENT_NOT_FOUND`
- `TRACKING_SUBSCRIPTION_FAILED`
- `TRACKING_SUBSCRIPTION_FORBIDDEN`
- `TRIP_CONSENT_REQUIRED`
- `TRIP_END_IN_PAST`
- `TRIP_GROUP_MEMBERSHIP_EXISTS`
- `TRIP_ID_REQUIRED`
- `TRIP_MONITORING_NOT_ACTIVE`
- `TRIP_NOT_ACTIVE`
- `TRIP_NOT_FOUND`
- `TRIP_NOT_OPEN`
- `TRIP_NOT_PLANNED`
- `TRIP_SAFETY_NOT_ACTIVE`
- `TRIP_TRACKING_NOT_ACTIVE`
- `TRIP_WINDOW_EXPIRED`
- `UNAUTHORIZED`
- `UNIQUE_CONSTRAINT_VIOLATION`
- `UNIT_MANAGE_FORBIDDEN`
- `USERNAME_ALREADY_EXISTS`
- `USE_TRIP_CONSENT_ENDPOINT`
- `VALIDATION_ERROR`

Clients should branch on `error.code`, not message text.

## Emergency dispatch errors

New domain error codes include `EMERGENCY_SERVICE_FORBIDDEN`, `DISPATCH_NOT_OWNED`, `SERVICE_CANCEL_FORBIDDEN`, `INCIDENT_LOCATION_REQUIRED`, `NO_AVAILABLE_EMERGENCY_UNIT`, and existing dispatch transition/unit errors. Tracking also uses `TRACKING_FORBIDDEN` when a tourist attempts to read another incident's dispatch.

## Latest blockchain/signal-loss error semantics

- `DATE_OF_BIRTH_REQUIRED`: individual blockchain trip credential cannot be created without DOB.
- Immutable-profile validation rejects tourist attempts to change protected identity/contact fields during a planned/active trip.
- Snapshot decrypt/hash/identity mismatch is treated as an integrity failure and must not be silently used to overwrite PostgreSQL.
- Blockchain snapshot job failure is independent from the credential's issuance status.
- `SIGNAL_LOSS_CASE_NOT_FOUND` hides unauthorized/non-owned signal-loss cases as not found.
- `SIGNAL_LOSS_RESPONSE_INVALID` is returned for responses other than `FALSE_ALARM` / `CONFIRMED_DANGER`.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## 2026-08-27 operational error notes

Treat browser `Network Error` during login/refresh as a likely CORS/preflight or unreachable-backend problem before treating it as invalid credentials. A backend `500` during dispatch status progression is an application/server failure and must not be hidden behind optimistic frontend status changes.

Blockchain `ID_NOT_FOUND` / `SNAPSHOT_NOT_FOUND` contract reverts indicate missing on-chain state and should be surfaced/reconciled as such rather than silently inventing a trusted snapshot.

---

## Repository synchronization — 2026-08-27

Error handling now treats Prisma unique-constraint failures as a generic conflict for end users. Do not expose messages such as `A record with these values already exists`, constraint targets, or raw Prisma metadata in production responses. SOS location failures should use a clear application-level validation/error code instead of silently storing invalid coordinates.
