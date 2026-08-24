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

Only hashes, timestamps, addresses, numeric reason codes, and version values are on-chain.
