# KAVACH Blockchain Trust Layer

The `blockchain/` workspace implements KAVACH's tamper-evident trust layer. It is **not** the primary application database and it is **not** exposed directly to tourists.

The production integration is split into three cooperating pieces:

```text
Main KAVACH backend
    |
    | authenticated HTTP
    | x-kavach-chain-key
    v
Blockchain Gateway
    |
    | ethers.js + issuer wallet
    v
TrustAnchor.sol
    |
    v
Ethereum-compatible network
```

PostgreSQL remains authoritative for users, trips, groups, credentials, incidents, dispatches, notifications, and operational workflows. Blockchain stores verification-oriented state, hashes, and encrypted append-only snapshots.

## 1. What the live backend integration uses

The main backend currently integrates the gateway for:

- individual trip credential issuance;
- group trip credential issuance;
- trip credential expiry extension;
- credential revocation;
- credential verification;
- append-only encrypted individual/group snapshots;
- reading the latest trusted snapshot;
- background integrity reconciliation using those snapshots.

The Solidity contract additionally exposes evidence, incident, and consent hash anchoring. CLI/adapter support exists for those proof types, but the current lightweight production gateway ABI is focused on credentials and data snapshots. Do not assume every application incident/evidence item is automatically written on-chain merely because the contract has a function for it.

## 2. Repository layout

```text
blockchain/
├── contracts/TrustAnchor.sol
├── gateway/server.ts
├── adapter/
│   ├── canonicalize.ts
│   ├── hasher.ts
│   ├── chainClient.ts
│   ├── jobQueue.ts
│   ├── privacyScan.ts
│   └── httpcontract/
├── scripts/
├── test/
├── deployments/
├── artifacts/
└── docs/
```

## 3. Smart-contract feature set

### Credential lifecycle

`issueId()` stores a one-shot `DigitalId` record keyed by `idHash`. Reissuing the same hash is rejected so historical identity is preserved.

`extendId()` increases the expiry of an ACTIVE credential only.

`revokeId()` transitions an ACTIVE credential to REVOKED and records only a numeric reason code in the event.

`verifyId()` returns status, issuer, issued/expiry timestamps, and version. It applies **lazy expiry**: an ACTIVE stored record whose expiry has passed is reported as EXPIRED without a state-changing transaction.

### Encrypted data snapshots

`appendDataSnapshot()` appends a snapshot containing:

- `payloadHash`;
- encrypted payload bytes;
- block timestamp;
- strict sequential number;
- snapshot type.

Snapshots are append-only. Sequence must equal the previous count + 1.

### Hash anchors

The contract can idempotently anchor evidence, incident, and consent hashes. Re-anchoring the same hash is a no-op rather than a revert.

### Issuer administration

The deployer becomes `admin` and the first authorized issuer. Only the admin can authorize/revoke issuer addresses. State-changing trust operations require an authorized issuer.

## 4. Production gateway

`gateway/server.ts` is the service the main backend actually calls. It owns:

- `CHAIN_RPC_URL`;
- `CONTRACT_ADDRESS`;
- `ISSUER_PRIVATE_KEY`;
- `GATEWAY_API_KEY`.

The main backend receives only the gateway URL and the matching internal API key.

Public liveness endpoints do not contact the chain:

```text
GET /
GET /health
GET /healthz
```

Readiness endpoints do contact the RPC and verify contract bytecode/chain ID:

```text
GET /ready
GET /readiness
```

Protected endpoints require:

```http
x-kavach-chain-key: <GATEWAY_API_KEY>
```

## 5. Asynchronous backend queue

The main backend does not make credential creation depend on immediate chain availability. It creates a `BlockchainAnchorJob` and a background worker processes it.

```text
application operation
      |
      +--> PostgreSQL credential/domain state succeeds
      |
      `--> blockchain job = PENDING
                |
                v
          background worker
                |
                +--> gateway call succeeds -> CONFIRMED
                |
                `--> failure -> retry/backoff -> FAILED after max attempts
```

This isolates KAVACH's operational flow from RPC latency and temporary network failures.

## 6. Credential verification

QR verification is layered:

```text
signed QR JWT
  + local credential exists and tokenId matches
  + credential not revoked/expired
  + trip is PLANNED or ACTIVE
  + if blockchain anchor is confirmed: chain status must be ACTIVE
```

If blockchain is enabled but a read is temporarily unavailable, the verification response exposes that chain condition rather than pretending a successful chain verification occurred.

## 7. Integrity snapshots

For individual credentials, the backend constructs a snapshot containing identity/trip fields, hashes the canonical payload, encrypts it, and appends it to the on-chain snapshot history.

For groups, a group snapshot contains group/trip/leader/member-count information and later membership snapshots can append added-member context.

The integrity worker reads the latest snapshot, verifies its hash, decrypts it with the backend-held data encryption key, and compares trusted values with PostgreSQL. Supported tampered fields can be restored. Group membership-count drift is detected but automatic destructive membership repair is intentionally blocked.

## 8. Privacy boundary

The public contract is not given the issuer private key's plaintext source data. Credential identifiers are SHA-256-derived hashes. Snapshot plaintext is encrypted before being placed in the contract's bytes field.

The `adapter/privacyScan.ts` utility additionally inspects event ABI types and recent event values for suspicious PII-shaped data.

Important nuance: encrypted snapshot bytes are still on a public ledger. Their confidentiality therefore depends on strong application-key management and encryption design. Do not confuse encryption with invisibility.

## 9. Commands

```bash
cd blockchain
npm install
npm test
npm run build
npm run gateway
```

Deploy local/testnet according to `docs/deployment.md`.

## 10. Documentation map

- `docs/implementation.md`: code-level breakdown.
- `docs/workflow.md`: full credential/snapshot/integrity flows.
- `docs/data-storage-and-integrity.md`: exactly what is stored where.
- `docs/deployment.md`: contract/gateway deployment and environment.
- `docs/plan.md`: trust-model design and extension rules.
- `test/README.md`: test coverage and how to run it.
