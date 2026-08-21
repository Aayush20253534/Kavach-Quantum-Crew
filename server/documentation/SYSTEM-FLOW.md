# How the Smart Tourist Safety System Works

This document explains the backend without requiring knowledge of Node.js, Prisma, or databases.

## The simple idea

A tourist creates a trip and explicitly agrees to the safety/location features they want to use. During an active trip, the backend receives location and safety information. It checks deterministic safety rules. If a serious problem appears, the system creates an incident and brings disaster-management staff into the response workflow.

## Normal tourist journey

```text
1. Tourist creates an account
        |
2. Tourist completes profile/onboarding
        |
3. Tourist creates a SOLO or GROUP trip
        |
4. Tourist grants required trip consents
        |
5. Backend issues a trip-scoped Safety ID
        |
6. Tourist starts the trip
        |
7. Client sends location updates
        |
8. Backend checks safety conditions
        |
        +-- safe -> keep monitoring
        |
        +-- concern -> create/update safety alert
                         |
                         +-- serious/actionable -> create incident
```

## What safety monitoring checks

Trusted location/check-in data can be evaluated against:
- safe/risk geofences
- polygon or circular risk zones
- missed/overdue check-ins
- stale or interrupted tracking
- prolonged inactivity
- trip overtime
- group separation
- optional configured route deviation

These are deterministic backend rules. AI is not required for these checks.

## Manual SOS flow

```text
Tourist presses SOS
    -> backend validates active trip
    -> uses supplied or latest trusted location
    -> creates CRITICAL SOS
    -> creates/links emergency incident
    -> disaster-management notification
    -> acknowledgement / response / dispatch
    -> communication and evidence if needed
    -> resolution
```

## Incident response

```text
OPEN
  -> ACKNOWLEDGED
      -> IN_PROGRESS
          -> RESOLVED

or staff may DISMISS a false-positive/non-actionable incident.
```

During response:
- responders can be assigned subject to availability/capacity,
- staff can add operational notes,
- tourist/group participants and staff can exchange incident messages,
- an emergency unit can be requested/assigned/dispatched,
- authorized evidence can be uploaded,
- notifications and realtime events keep clients synchronized.

## Emergency dispatch

```text
REQUESTED
  -> ASSIGNED
      -> DISPATCHED
          -> EN_ROUTE
              -> ON_SCENE
                  -> COMPLETED
```

Cancellation/completion releases the unit back to availability.

## Group trip flow

```text
Leader creates GROUP trip
   -> leader creates group
   -> leader creates expiring invitation
   -> other tourist joins
   -> each participant independently controls tracking consent
   -> active members can share authorized group location
   -> monitoring can detect abnormal separation
```

Only a hash of the invitation token is persisted.

## Hazard flow

```text
Tourist reports hazard
   -> PENDING
   -> staff verifies or rejects
   -> verified hazard becomes visible under normal visibility rules
   -> nearby queries can surface it
   -> staff later resolves it
```

## Evidence flow

```text
authorized user uploads file
   -> MIME/size validation
   -> bytes stored behind storage adapter
   -> SHA-256 checksum calculated
   -> metadata stored in PostgreSQL
   -> every read/download is authorized again
```

Knowing an attachment ID is not sufficient permission to download it.

## Notifications

The backend has two related concepts:
1. `Notification`: application-level message for an account.
2. `NotificationDelivery`: operational delivery attempt through a channel.

Channels include `IN_APP`, `EMAIL`, `SMS`, `PUSH`, and `WHATSAPP`.

## AI

The working safety system does not depend on AI. Optional contracts exist for risk assessment and hazard analysis. If no provider exists, the default provider fails closed rather than inventing a prediction.

## Blockchain

Optional contracts exist for Safety ID proof, incident proof, evidence proof, and verification. The backend does not contain wallets, chain keys, smart contracts, or consensus logic.

## Administration and operations

System Admins can manage accounts/resources, inspect audit history/metrics/diagnostics, and process delivery jobs. Disaster Managers focus on emergency operations, hazards, risk zones, dispatch, and analytics.
