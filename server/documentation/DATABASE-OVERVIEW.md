# Database Overview

Database: PostgreSQL, accessed through Prisma.

Current Prisma models (33):
`User, DisasterManager, SystemAdmin, AuthSession, AuditLog, Trip, TripMonitoringPolicy, TripSafetyId, TripConsent, TripGroup, GroupMember, GroupInvitation, TripParticipantConsent, LocationPing, LatestTrustedLocation, SafetyZone, TripCheckIn, GeofenceEvent, SafetyAlert, Incident, IncidentMessage, IncidentEvent, SosRequest, Notification, IncidentAssignment, IncidentNote, NotificationDelivery, NotificationDeliveryAttempt, HazardReport, Attachment, EmergencyUnit, Dispatch, DispatchEvent`

## Domain groups

### Accounts
`User`, `DisasterManager`, `SystemAdmin`, `AuthSession`, `AuditLog`

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
User -> Trip -> tracking/safety -> SafetyAlert -> Incident -> dispatch/messages/evidence
HazardReport -> Attachment
Notification -> NotificationDelivery -> NotificationDeliveryAttempt
```

Evidence bytes live behind the storage adapter; the DB stores metadata/checksum/storage key.
