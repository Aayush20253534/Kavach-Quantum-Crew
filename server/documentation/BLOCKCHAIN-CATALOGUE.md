# Blockchain Integration Catalogue

## Scope

These endpoints are provider contracts only. This repository does not implement wallets, smart contracts, signing keys, RPC clients, transactions, gas handling, or chain deployment.

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
