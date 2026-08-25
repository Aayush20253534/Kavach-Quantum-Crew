# Emergency Service Dispatch Backend

## Purpose

The disaster-management backend now supports three operational fleet sections: **Police**, **Fire**, and **Ambulance**. The frontend can render these as separate fleet panels, while the backend keeps one shared dispatch engine so status handling, audit history, incident linkage, and realtime tracking behave consistently.

## Actors

- `DISASTER_MANAGER`: receives incident/SOS traffic and may manually assign a unit or auto-assign the nearest available unit.
- `SYSTEM_ADMIN`: retains emergency-unit administration privileges.
- `POLICE`, `FIRE`, `AMBULANCE`: emergency-service portal roles. The role is derived from the service type selected during account registration.
- `TOURIST`: can read tracking for a dispatch attached to the tourist's own incident.

## Service account registration

`POST /api/v1/emergency-services/register`

The single registration endpoint accepts `serviceType` as `POLICE`, `FIRE`, or `AMBULANCE`, plus the service location. The location can be supplied by browser/device geolocation in the future frontend.

Example request:

```json
{
  "name": "Central Fire Control",
  "username": "central.fire",
  "email": "fire@example.com",
  "phone": "9876543210",
  "password": "StrongPass1",
  "confirmPassword": "StrongPass1",
  "serviceType": "FIRE",
  "organization": "City Fire Service",
  "address": "Sector 4",
  "jurisdiction": "Sector 4",
  "latitude": 21.1458,
  "longitude": 79.0882
}
```

Registration creates both the service account and its initial `AVAILABLE` primary emergency unit at the same coordinates. Login uses the existing `POST /api/v1/auth/login` endpoint with the matching selected role (`POLICE`, `FIRE`, or `AMBULANCE`).

## Nearest-unit auto assignment

Disaster Management can call one of the following backend endpoints:

- `POST /api/v1/dispatch/incidents/:incidentId/auto/police`
- `POST /api/v1/dispatch/incidents/:incidentId/auto/fire`
- `POST /api/v1/dispatch/incidents/:incidentId/auto/ambulance`

The incident may originate from SOS or the normal incident pipeline. The algorithm requires incident coordinates, fetches `AVAILABLE` units of the requested type that have coordinates, computes Haversine distance from each unit to the incident, sorts by distance, and assigns the nearest unit. The chosen unit immediately becomes `DISPATCHED` at the unit-resource level so it is not considered available for another assignment.

Manual assignment continues to use the existing dispatch endpoints, so Disaster Management can override automatic selection where operational judgment is required.

## Emergency service portal endpoints

Authenticated Police/Fire/Ambulance accounts use:

- `GET /api/v1/emergency-services/me`
- `PATCH /api/v1/emergency-services/me/location`
- `GET /api/v1/emergency-services/me/dispatches`
- `PATCH /api/v1/emergency-services/dispatches/:dispatchId/location`
- `PATCH /api/v1/emergency-services/dispatches/:dispatchId/status`

A service account can update only a dispatch assigned to one of its own units and matching its service type. Valid field-team progression is `ASSIGNED -> DISPATCHED -> EN_ROUTE -> ON_SCENE -> COMPLETED`. Cancellation remains a Disaster Management responsibility.

## Tourist realtime tracking

The tourist reads the current snapshot with:

`GET /api/v1/emergency-services/tracking/:dispatchId`

The endpoint verifies that the dispatch belongs to the tourist's incident. It returns service type, dispatch state, emergency-unit identity, last known unit coordinates/time, incident destination coordinates, approximate remaining straight-line distance, and the dispatch timeline.

Realtime Socket.IO updates reuse the incident room. A tourist subscribes to the incident using `incident:subscribe`. Service location/status updates publish `dispatch:updated`; the same event is delivered to the tourist incident room, Disaster Management, System Admin, and the assigned service account room.

## Data model

`EmergencyServiceAccount` stores the emergency service identity, selected service type, authentication fields, organization/jurisdiction, base/current coordinates, and `locationUpdatedAt`.

`EmergencyUnit` now optionally belongs to an emergency-service account and stores `latitude`, `longitude`, and `locationUpdatedAt`. Existing standalone admin-created units remain supported because `serviceAccountId` is nullable.

The `Role` enum now also includes `POLICE`, `FIRE`, and `AMBULANCE` so existing JWT/session infrastructure can authenticate the unified emergency-service portal without inventing a parallel auth stack.

## Docker and migrations

The Docker runtime now executes `npm run prisma:migrate:deploy` before starting Node. This ensures the emergency-service migration is applied in container deployments. Production deployments must provide `DATABASE_URL` and should use a database account authorized to run committed migrations.

## Production hardening note

The current registration endpoint creates an active service account for the project workflow. A production deployment should add organization verification/approval before permitting operational dispatch access. Do not expose unrestricted emergency-service registration on a public production API without that control.

## Single-account fleet model

For the current product scope, one emergency-service account represents the entire responding fleet/organization. Do not create separate accounts for vehicles and do not require a Fleet or Profile screen in the responder UI.

Recommended responder navigation is intentionally small:

- **Active Dispatch** - current assigned emergency and status actions.
- **Live Tracking** - map/location sharing while responding.
- **Dispatch History** - completed/cancelled dispatches.

The internally associated `EmergencyUnit` record is an implementation detail used by the dispatch engine for availability and location. In the current UI model it should be treated as the location/status of the whole registered Police, Ambulance/Hospital, or Fire fleet account.

## Dispatch email delivery

Whenever a Police, Ambulance, or Fire fleet is assigned, the backend also sends a Brevo transactional email to the registered emergency-service account email address. This applies to both:

- nearest-fleet automatic assignment (`/dispatch/incidents/:incidentId/auto/:serviceType`), and
- Disaster Management/manual assignment.

The email contains incident summary information and a deep link generated from `PUBLIC_APP_URL`:

```text
/login?redirect=/emergency-services/dispatches/<dispatchId>&role=<POLICE|AMBULANCE|FIRE>
```

Frontend contract: if the fleet is already authenticated, the login route should immediately honor `redirect`. Otherwise it should complete login and then navigate to the requested active dispatch.

Emergency email failure is logged but does not roll back or block an emergency dispatch. Dispatch persistence and realtime delivery remain authoritative even if the external email provider is temporarily unavailable.

## Disaster Management incident email

Every newly created incident entering the Disaster Management queue, including tourist SOS incidents and safety-alert/manual incident ingestion, also generates an email to every active Disaster Manager with an email address.

The link format is:

```text
/login?redirect=/disaster-management/incidents/<incidentId>&role=DISASTER_MANAGER
```

After authentication the frontend should open the exact incident rather than the generic queue.
