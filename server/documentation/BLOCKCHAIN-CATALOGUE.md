# Blockchain Integration Catalogue

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Current implementation status

The **live Express-to-chain path currently covers individual/group trip credentials**: issue, extend, revoke, and verify. `TrustAnchor.sol` also contains evidence and incident anchoring primitives, but those are contract/script capabilities until backend services enqueue and call them. Do not describe every backend incident/evidence record as automatically on-chain.

For the detailed execution path, see [`../../blockchain/docs/workflow.md`](../../blockchain/docs/workflow.md).

## Scope

This catalogue covers two related surfaces. The `/api/v1/integrations/blockchain/*` proof endpoints remain provider-contract boundaries, while trip QR credentials have a live implementation through `src/integrations/blockchain/`, the database-backed anchor worker, and the isolated `blockchain/gateway/`. The Express process never holds the issuer private key; signing, RPC, gas, contract calls, and deployment remain isolated in the blockchain workspace/gateway.

Access: `DISASTER_MANAGER` or `SYSTEM_ADMIN`.

## Common proof fields

Proof payloads include:
- `referenceId`
- `payloadHash`: exactly 64 hexadecimal characters
- `timestamp`

The design is for hashes/proof metadata, not raw PII, GPS history, medical data, or evidence bytes.

## Safety ID proof

`POST /api/v1/integrations/blockchain/safety-id-proof`

Adds:
```json
{ "safetyId": "trip-scoped safety id" }
```

Connect to a contract/service that anchors non-sensitive proof associated with the Safety ID.

## Incident proof

`POST /api/v1/integrations/blockchain/incident-proof`

Adds:
```json
{ "incidentId": "UUID" }
```

Connect to a ledger/contract that records tamper-evident incident proof metadata.

## Evidence proof

`POST /api/v1/integrations/blockchain/evidence-proof`

Adds:
```json
{ "attachmentId": "UUID" }
```

Anchor checksum/proof metadata. Evidence bytes stay in storage and should not be put on-chain.

## Verification

`GET /api/v1/integrations/blockchain/verification/:reference`

Connect to the provider's chain/contract lookup.

## Blockchain-team responsibility
- network/RPC connection
- contract interface
- transaction signing
- secure key management
- chain-specific identifiers
- confirmation/finality policy
- idempotency/retry
- stable verification response

Recommended proof response:

```json
{
  "reference": "provider-reference",
  "transactionId": "chain-specific-id",
  "status": "ACCEPTED"
}
```

## Authentication baseline

These staff-only integration endpoints are unaffected by the public tourist signup OTP flow. Tourist accounts cannot call them, and unverified tourists cannot establish normal authenticated sessions in the first place.

## Live QR credential integration

The previous provider placeholder is no longer the path used for trip IDs. Trip credentials use the internal blockchain gateway and an asynchronous PostgreSQL queue.

### Credential types

- `INDIVIDUAL`: one credential per `(tripId, userId)`; group members receive their own credential when they join.
- `GROUP`: one credential per group trip.

### Lifecycle mapping

| Application event | Database action | Chain action |
|---|---|---|
| Trip created | create individual credential | `issueId` |
| Group created | create group credential | `issueId` |
| Member joins | create member individual credential | `issueId` |
| Trip extended | update `expiresAt` | `extendId` |
| Member leaves/removed | set `revokedAt` | `revokeId` |
| Trip completed/cancelled/auto-ended | revoke all trip credentials | `revokeId` |
| Natural planned end | QR JWT + API validity expires | `verifyId` reports `EXPIRED` |

Credential/evidence/incident anchors remain hash-and-metadata based. The latest contract additionally stores encrypted identity/group snapshot ciphertext together with payload hashes, sequence/type metadata, timestamps, and issuer addresses. Plaintext PII is not stored on-chain.

## Emergency dispatch integration

The Police/Fire/Ambulance fleet feature does not require new blockchain writes. Incident/evidence anchoring remains separate from operational geolocation, which should stay off-chain because live responder coordinates are mutable and privacy-sensitive.

## Encrypted identity/group snapshot operations

Current runtime blockchain integration has two layers:

1. **Credential trust state**: existing `idHash`, trip hash, issue/extend/revoke/verify.
2. **Append-only data snapshots**: `appendDataSnapshot`, `getDataSnapshotCount`, `getLatestDataSnapshot`, and `getDataSnapshot`.

Snapshot type `1` is an individual trip identity snapshot; type `2` is a group history snapshot. Payload plaintext is canonicalized, SHA-256 hashed, AES-256-GCM encrypted by the backend, and only the hash/ciphertext/sequence/type are submitted on-chain. The gateway never needs plaintext personal data.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

## Current individual and group integrity reconciliation

The integrity scheduler runs every five seconds for open confirmed credentials. Type `1` snapshots are individual identity/contact snapshots; type `2` snapshots are group state/history snapshots. Both are canonicalized, SHA-256 hashed and AES-256-GCM encrypted before the gateway call.

For exact plaintext payload schemas versus Solidity storage, see `../../blockchain/docs/data-storage-and-integrity.md`.

Realtime status is intentionally separate from credential `chainStatus`: a credential can be `CONFIRMED` while its snapshot reports `INTEGRITY_UNAVAILABLE`. The UI must not equate credential confirmation with snapshot approval.

## 2026-08-27 integration note

The August operational/UI changes do not make blockchain the source of truth for live trip, incident, fleet, or chatbot state. Blockchain remains an integrity/credential subsystem. Reconciliation failures must degrade/report clearly and must not cause the application to fabricate a snapshot or identity that the contract reports as missing.

---

## Repository synchronization — 2026-08-27

Blockchain reconciliation is asynchronous. Snapshot unavailable/pending states are distinct from confirmed mismatches; database membership changes can temporarily precede a fresh blockchain snapshot. Keep automatic repair blocked when trusted snapshot evidence is missing.
