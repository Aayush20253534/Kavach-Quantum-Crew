# How the Smart Tourist Safety System Works

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


This document explains the backend without requiring knowledge of Node.js, Prisma, or databases.

## The simple idea

A tourist creates a trip and explicitly agrees to the safety/location features they want to use. During an active trip, the backend receives location and safety information. It checks deterministic safety rules. If a serious problem appears, the system creates an incident and brings disaster-management staff into the response workflow.

## Normal tourist journey

```text
1. Tourist creates an account
        |
2. Backend emails a 6-digit OTP
        |
3. Tourist verifies the email
        |
4. Backend issues the first authenticated session
        |
5. Tourist completes profile/onboarding
        |
6. Tourist creates a SOLO or GROUP trip
        |
7. Tourist grants required trip consents
        |
8. Backend issues a trip-scoped Safety ID
        |
9. Tourist starts the trip
        |
10. Client sends location updates
        |
11. Backend checks safety conditions
        |
        +-- safe -> keep monitoring
        |
        +-- concern -> create/update safety alert
                         |
                         +-- serious/actionable -> create incident
```

## First-time email verification

Email OTP is a one-time account-verification step, not a login OTP.

```text
register
   -> backend generates 6 digits
   -> Gmail sends OTP
   -> tourist submits email + OTP
   -> emailVerifiedAt is set
   -> access/refresh session issued
   -> future logins use normal credentials
```

The code expires after the configured TTL (10 minutes by default). Resending is rate/cooldown controlled, creates a fresh OTP, and replaces the previous active code. Too many wrong attempts invalidate the active OTP. If the tourist later changes email, the new address must be verified again.

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

## QR + blockchain credential lifecycle

```text
Trip create/join
  -> PostgreSQL credential created
  -> signed QR can be rendered immediately
  -> BlockchainAnchorJob(PENDING)
  -> worker calls blockchain gateway
  -> TrustAnchor issueId/extendId/revokeId
  -> job + credential marked CONFIRMED

QR scan
  -> frontend /verify/:token
  -> API verifies JWT + tokenId + DB expiry/revocation + trip state
  -> if anchor is confirmed, API reads TrustAnchor verifyId
  -> result shown as VALID / INVALID with blockchain status
```

## Emergency fleet flow

Incident/SOS -> Disaster Management -> choose Police/Fire/Ambulance -> manual assignment or nearest-unit auto assignment -> service account receives assignment -> service sends location/status updates -> tourist receives delivery-style tracking snapshots/events -> unit becomes available again after completion. Both SOS and manually originated incidents use the same dispatch engine.

## Emergency email path

```text
Tourist SOS / incident
        |
        v
Incident persisted + realtime notification
        |
        +--> Email all active Disaster Managers
             /login?redirect=/disaster-management/incidents/:id

Disaster Management dispatches
        |
        +--> nearest automatic fleet OR manual fleet selection
        |
        v
Dispatch persisted as ASSIGNED
        |
        +--> Socket.IO dispatch update
        +--> Email selected Police/Ambulance/Fire fleet
             /login?redirect=/emergency-services/dispatches/:id
```

Email is a notification transport, not the source of truth. Incident/dispatch database state is created first and remains valid if Brevo delivery fails.

## Latest end-to-end safety flow

```text
Danger-zone entry
  -> tourist notification + tourist email
  -> Disaster Management notification + email
  -> review/incident handling
  -> no automatic responder notification

Group member offline >= tracking-gap threshold (default 5 min)
  -> create SignalLossCase
  -> leader + Disaster Management app/email notification
  -> leader has 5 min: FALSE_ALARM | CONFIRMED_DANGER
       FALSE_ALARM -> close case
       CONFIRMED_DANGER -> incident escalation
       timeout -> incident escalation
  -> if still offline, remind again after 5 min and open a fresh 5-min response window

Disaster Management initiates dispatch
  -> optional nearest available unit selection by service type
  -> responder email + realtime/app dispatch
  -> responder sends browser GPS
  -> tourist + Disaster Management + authorized responder see live tracking
```

Group QR codes use a standard signed HTTPS join URL. Blockchain issuance keeps the credential `idHash`; encrypted append-only snapshots add trip identity/group-history integrity without putting plaintext PII on Sepolia.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

## Current blockchain reconciliation flow

```text
confirmed individual/group credential
  -> every 5 seconds read latest snapshot
  -> decrypt + verify SHA-256 payloadHash + identity
  -> compare protected PostgreSQL fields
  -> match: publish VERIFIED
  -> mismatch: publish DB_TAMPERED
       -> publish FIXING
       -> safely restore supported fields
       -> audit recovery
       -> publish FIXED
       -> publish VERIFIED
  -> unreadable/unsafe snapshot: publish INTEGRITY_UNAVAILABLE
```

Group membership-count mismatches are detected but are not automatically repaired by deleting or inventing member rows.

## 2026-08-27 operational flow addendum

Current emergency flow:

1. an active tourist trip can generate danger-zone, SOS, manual-safety, or confirmed/no-response signal-loss incidents;
2. Disaster Management triages and assigns an emergency-service fleet;
3. the fleet account receives the assignment and progresses the allowed response lifecycle;
4. live responder GPS is transmitted during response and shared tracking renders a route to the incident;
5. completion resolves the dispatch operationally;
6. trip completion/cancellation expires remaining trip-derived active safety state.

A fleet account's registered location is a fixed base/reference and does not replace live response telemetry.
