# Database Overview

Database: PostgreSQL, accessed through Prisma.

Current Prisma models (34):
`User, EmailVerificationOtp, DisasterManager, SystemAdmin, AuthSession, AuditLog, Trip, TripMonitoringPolicy, TripSafetyId, TripConsent, TripGroup, GroupMember, GroupInvitation, TripParticipantConsent, LocationPing, LatestTrustedLocation, SafetyZone, TripCheckIn, GeofenceEvent, SafetyAlert, Incident, IncidentMessage, IncidentEvent, SosRequest, Notification, IncidentAssignment, IncidentNote, NotificationDelivery, NotificationDeliveryAttempt, HazardReport, Attachment, EmergencyUnit, Dispatch, DispatchEvent`

## Domain groups

### Accounts
`User`, `EmailVerificationOtp`, `DisasterManager`, `SystemAdmin`, `AuthSession`, `AuditLog`

### Trips and groups
`Trip`, `TripMonitoringPolicy`, `TripSafetyId`, `TripConsent`, `TripGroup`, `GroupMember`, `GroupInvitation`, `TripParticipantConsent`

### Tracking and safety
`LocationPing`, `LatestTrustedLocation`, `SafetyZone`, `TripCheckIn`, `GeofenceEvent`, `SafetyAlert`

### Emergency response
`Incident`, `IncidentMessage`, `IncidentEvent`, `SosRequest`, `IncidentAssignment`, `IncidentNote`, `EmergencyUnit`, `Dispatch`, `DispatchEvent`

### Hazards/evidence
`HazardReport`, `Attachment`

### Notifications
`Notification`, `NotificationDelivery`, `NotificationDeliveryAttempt`

Simplified flow:

```text
User -> EmailVerificationOtp (temporary until verified)
User -> Trip -> tracking/safety -> SafetyAlert -> Incident -> dispatch/messages/evidence
HazardReport -> Attachment
Notification -> NotificationDelivery -> NotificationDeliveryAttempt
```

Evidence bytes live behind the storage adapter; the DB stores metadata/checksum/storage key.

## Tourist email verification data

`User.emailVerifiedAt` records when the current tourist email was verified. `EmailVerificationOtp` is a one-to-one temporary record containing only a keyed code hash plus expiry, attempt count, and last-send timestamp. The raw six-digit OTP is never persisted. Successful verification deletes the OTP record. Existing tourists were backfilled as verified by migration `20260822011000_email_verification_otp`.
