# Blockchain End-to-End Workflows

## 1. Individual credential creation

```text
Tourist has trip
    |
    v
GET/ensure individual credential
    |
    +--> local credential exists and active? -> return it
    |
    `--> create/reissue local credential
            |
            +--> publicId
            +--> tokenId
            +--> chainHash
            +--> expiry = trip planned end
            |
            +--> enqueue ISSUE job
            |
            `--> build individual snapshot
                    schema
                    idHash
                    tripId/userId
                    name/dateOfBirth
                    destination
                    phone/email
                    |
                    +--> hash snapshot
                    +--> encrypt snapshot
                    `--> enqueue SNAPSHOT sequence 1
```

A date of birth is required before the individual blockchain trip credential snapshot is created.

## 2. Group credential creation

Group creation initializes a group credential. The backend hashes the group credential identity, queues issuance, then snapshots:

- group ID/trip ID;
- group name;
- member count;
- destination;
- leader name/email/phone;
- optional newly added member data for later membership snapshots.

When a member is added, `appendGroupMembershipSnapshot()` calculates the next sequence from existing snapshot jobs and queues another append-only group snapshot.

## 3. Queue processing

Main backend queue states:

```text
PENDING
   |
   v
PROCESSING
   |
   +--> gateway success -> CONFIRMED
   |
   `--> failure
          |
          +--> attempts < max -> PENDING with future availableAt
          `--> attempts >= max -> FAILED
```

Retry delay uses capped exponential backoff. Credential `chainStatus` is updated for ISSUE/EXTEND/REVOKE operations. Snapshot jobs have their own job state and do not overwrite the credential's issuance status.

The background job can process multiple queued items per tick.

## 4. Failed-anchor retry

When a credential with `chainStatus=FAILED` is later fetched, the credential service can requeue the latest failed anchor and reset attempts/state. Failed snapshot jobs have a dedicated retry helper used by integrity reconciliation.

## 5. Trip extension

```text
trip expiry changes
   |
   v
list individual + group credentials
   |
   v
update local credential expiry/chainStatus
   |
   v
enqueue EXTEND
   |
   v
gateway /v1/credentials/extend
   |
   v
TrustAnchor.extendId
```

Revoked credentials are skipped.

## 6. Trip/credential revocation

Revoking a trip marks local credential records revoked and enqueues chain revocation. Individual revocation uses its own operation and can use a separate numeric reason code.

The contract never stores the free-text reason.

## 7. QR verification

```text
QR token
  |
  +--> verify JWT signature/issuer/audience
  +--> map typ to INDIVIDUAL or GROUP
  +--> load credential row
  +--> tokenId must match current credential jti
  +--> local credential must be active
  +--> trip must be PLANNED or ACTIVE
  |
  `--> if chain enabled + chainStatus CONFIRMED
          |
          v
      gateway GET /v1/credentials/:idHash
          |
          v
      TrustAnchor.verifyId
          |
          `--> status must be ACTIVE
```

If the local token has been replaced, verification fails even before blockchain lookup.

## 8. Snapshot anchoring

```text
plaintext snapshot object
       |
       +--> stable serialization
       +--> SHA-256 payload hash
       +--> AES-GCM encryption in main backend
       |
       v
BlockchainAnchorJob(operation=SNAPSHOT)
       |
       v
gateway /v1/snapshots/append
       |
       v
TrustAnchor.appendDataSnapshot
       |
       v
append-only encrypted chain history
```

The encryption key remains in the main backend environment, not in the gateway/browser.

## 9. Individual integrity reconciliation

The integrity service:

1. finds the latest snapshot job for the credential;
2. retries failed snapshot jobs when appropriate;
3. reads the latest on-chain snapshot;
4. requires snapshot type `1`;
5. verifies `payloadHash` against decrypted plaintext;
6. verifies the snapshot's embedded identity/hash against the credential;
7. compares trusted snapshot fields with PostgreSQL;
8. if different, restores supported user/trip fields from the trusted snapshot;
9. records/logs the reconciliation result.

If no trusted readable snapshot exists, the service refuses to approve integrity rather than pretending the database is verified.

## 10. Group integrity reconciliation

The group flow similarly requires snapshot type `2`, verifies hash/identity, and compares group-level values.

A member-count mismatch is detected as drift, but automatic membership repair is intentionally blocked because an aggregate count is insufficient evidence for which member rows should be added/removed. The system waits for a more appropriate snapshot/review rather than guessing destructive mutations.

## 11. Gateway liveness vs readiness

```text
GET /health
    -> process alive only
    -> no RPC dependency

GET /ready
    -> provider.getNetwork()
    -> chain ID check
    -> provider.getCode(contractAddress)
    -> 200 only when chain/contract are ready
```

Separating these prevents Render from killing an otherwise healthy process merely because Sepolia/RPC is temporarily unavailable.

## 12. Contract-level proof anchors

For evidence, incident, and consent:

```text
canonical application payload
      |
      v
SHA-256 bytes32
      |
      v
anchorEvidence / anchorIncident / anchorConsent
      |
      v
exists + anchoredAt verification
```

These paths are available in the contract/adapter/CLI layer. They require explicit backend/gateway wiring before being considered part of the production application workflow.
