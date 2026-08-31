# Blockchain Implementation Reference

## 1. Components

### `contracts/TrustAnchor.sol`

The Solidity source of truth for on-chain rules.

### `gateway/server.ts`

Minimal Node HTTP gateway used by the main KAVACH backend in production. It directly constructs an ethers `JsonRpcProvider`, `Wallet`, and `Contract` from environment variables.

### `adapter/`

A richer TypeScript integration toolkit containing deterministic canonicalization, hashing, a chain client, an alternate/general anchor queue, privacy scanning, and catalogue-style HTTP route helpers.

### `server/src/integrations/blockchain/`

The actual main-backend integration layer. It owns gateway calls, Prisma-backed asynchronous jobs, snapshot encryption/hashing, and integrity reconciliation.

## 2. Contract data structures

### `IdStatus`

```text
0 ACTIVE
1 REVOKED
2 EXPIRED
```

EXPIRED can be returned lazily by `verifyId()` even when storage still says ACTIVE.

### `DigitalId`

```solidity
struct DigitalId {
    bytes32 tripHash;
    uint64 issuedAt;
    uint64 expiresAt;
    IdStatus status;
    address issuer;
    uint8 version;
}
```

Stored in `mapping(bytes32 => DigitalId) public ids`.

### `DataSnapshot`

```solidity
struct DataSnapshot {
    bytes32 payloadHash;
    bytes encryptedPayload;
    uint64 anchoredAt;
    uint32 sequence;
    uint8 snapshotType;
}
```

Stored as an array per credential hash.

## 3. Contract access control

The deployer is the admin and is authorized as an issuer in the constructor.

```text
admin
  |
  +--> authorizeIssuer(address)
  `--> revokeIssuer(address)

onlyAuthorizedIssuer
  |
  +--> issueId
  +--> extendId
  +--> revokeId
  +--> appendDataSnapshot
  +--> anchorEvidence
  +--> anchorIncident
  `--> anchorConsent
```

Tourist wallets are not part of this model.

## 4. Credential issuance

`issueId(idHash, tripHash, issuedAt, expiresAt, version)` validates:

- the hash has never been issued;
- expiry is later than issuance;
- caller is authorized.

It stores the record ACTIVE and emits `IdIssued`.

The main backend derives:

```text
idHash  = SHA256("kavach:v1:<type>:<publicId>:<tripId>:<tokenId>")
tripHash = SHA256("kavach:v1:trip:<tripId>")
```

and sends those bytes32 values through the gateway.

## 5. Extension and revocation

Extension requires an existing ACTIVE record and a strictly later expiry. The gateway treats an already-applied matching extension as idempotent after re-reading contract state.

Revocation requires an existing ACTIVE record. The gateway similarly treats an already-REVOKED record as idempotent.

Only a numeric `reasonCode` reaches the contract event; free-text revocation explanations stay off-chain.

## 6. Snapshot implementation

The main backend's snapshot module performs two separate operations:

1. deterministically serialize/hash the plaintext snapshot for integrity;
2. encrypt the snapshot before gateway submission.

The queued gateway call carries:

```json
{
  "idHash": "0x...",
  "payloadHash": "0x...",
  "ciphertext": "...",
  "sequence": 1,
  "snapshotType": 1
}
```

Contract sequence validation makes the history append-only and ordered.

Current snapshot types used by the backend:

```text
1 = individual identity/trip snapshot
2 = group/group-membership snapshot
```

## 7. Gateway validation

The gateway:

- limits request body to 32 KB;
- parses JSON itself;
- validates bytes32 fields with ethers `isHexString(value, 32)`;
- requires the internal API key on protected routes;
- maps common RPC/contract failures into stable HTTP error codes;
- waits for transaction receipts before returning a transaction hash.

Write calls have longer timeout tolerance in the main backend because public testnet confirmation can exceed ten seconds.

## 8. Gateway idempotency

For issue/extend/revoke, the gateway catches a contract conflict, reads current state, and returns `{ idempotent: true, txHash: null }` when the desired state is already present.

That makes retries safer after ambiguous network/receipt failures.

## 9. Adapter canonicalization

`adapter/canonicalize.ts` accepts JSON primitives only. It wraps payloads in:

```json
{
  "version": "...",
  "data": { "...": "..." }
}
```

Object keys are recursively sorted and the output contains zero insignificant whitespace. Non-JSON values such as `Date`, `undefined`, functions, or BigInt are rejected before hashing.

## 10. Adapter hashing

`adapter/hasher.ts` uses SHA-256 and returns 0x-prefixed 32-byte digests. Low-entropy identity inputs require an explicit salt in `hashIdPayload()`.

Specialized helpers exist for:

- digital IDs;
- evidence manifests;
- incident transition snapshots;
- consent/access receipts.

These adapter hash helpers are distinct from the simpler credential hash format currently used in `server/src/integrations/blockchain/blockchain.service.js`; callers must use the hash algorithm expected by their integration path consistently.

## 11. Evidence/incident/consent anchors

The contract implements:

```text
anchorEvidence / verifyEvidence
anchorIncident / verifyIncident
anchorConsent / verifyConsent
```

Writes are idempotent. The richer adapter and CLI scripts support these operations. The current production gateway ABI does not expose them as gateway routes, so they should be described as available contract/adapter capabilities rather than automatically active backend behavior.

## 12. Privacy scanner

`privacyScan.ts` checks:

- anchor-event ABI fields stay fixed-size hash/address/integer types;
- revocation uses numeric reason code;
- version fields exist where expected;
- recent bytes32 event values do not look suspiciously like plaintext ASCII;
- evidence event structure cannot contain raw file bytes.

The scan is a guardrail, not a substitute for cryptographic review.
