# Blockchain Data Storage and Integrity

## Purpose

Kavach uses Ethereum Sepolia as a tamper-evident trust layer, not as the primary application database. PostgreSQL remains authoritative for normal mutable application state and emergency workflows. The chain is used to prove credential state and to retain encrypted, append-only snapshots that can detect and repair selected database tampering.

## Services involved

1. The main `server/` creates credentials and snapshot jobs.
2. `server/src/integrations/blockchain/blockchain.service.js` calls the independent blockchain gateway.
3. `blockchain/gateway/server.ts` owns ethers/RPC/contract interaction.
4. `TrustAnchor.sol` stores credential records and encrypted snapshot history.
5. The main API's integrity job reads snapshots back, decrypts them server-side and publishes realtime integrity state through Socket.IO.

The browser never talks directly to the contract and never receives the issuer private key or snapshot encryption key.

## Credential hashes

The main API computes:

```text
idHash = SHA256("kavach:v1:<type>:<publicId>:<tripId>:<tokenId>")
tripHash = SHA256("kavach:v1:trip:<tripId>")
```

`type` is `INDIVIDUAL` or `GROUP`.

The `DigitalId` record stored by the contract contains:

```text
idHash -> {
  tripHash,
  issuedAt,
  expiresAt,
  status,
  issuer,
  version
}
```

The public `idHash` is therefore a one-way digest used as the contract key. The signed QR/JWT and normal database records remain application-layer concerns.

## Snapshot cryptography

The API performs snapshot protection before data reaches the gateway:

1. Build the snapshot object.
2. Canonicalize JSON so field ordering is deterministic.
3. SHA-256 the canonical plaintext to produce `payloadHash`.
4. Encrypt the same canonical plaintext using AES-256-GCM with the server-side `BLOCKCHAIN_DATA_ENCRYPTION_KEY`.
5. Send `{ idHash, payloadHash, ciphertext, sequence, snapshotType }` to the gateway.
6. The gateway calls `appendDataSnapshot`.
7. Solidity appends the record and never overwrites an earlier sequence.

`BLOCKCHAIN_DATA_ENCRYPTION_KEY` must remain stable. Losing or changing it without a key-version migration makes historical ciphertext unreadable.

## Individual snapshot: type 1

The plaintext object encrypted by the API is:

```json
{
  "schema": "kavach.individual.v1",
  "idHash": "<credential chainHash>",
  "tripId": "<trip UUID>",
  "userId": "<user UUID>",
  "name": "<tourist name>",
  "dateOfBirth": "<ISO date>",
  "destination": "<trip locationName>",
  "phone": "<tourist phone>",
  "email": "<tourist email>"
}
```

The contract does not receive those fields as Solidity strings. It receives only the SHA-256 `payloadHash` and AES-GCM ciphertext representing this object.

During a planned/active trip the tourist-side profile flow locks the protected identity/contact fields. Direct database tampering is still possible to simulate an attacker, which is why reconciliation exists.

## Group snapshot: type 2

Initial group snapshot:

```json
{
  "schema": "kavach.group.v1",
  "idHash": "<group credential chainHash>",
  "groupId": "<group UUID>",
  "tripId": "<trip UUID>",
  "groupName": "<group name>",
  "memberCount": 2,
  "destination": "<trip locationName>",
  "leader": {
    "name": "<leader name>",
    "email": "<leader email>",
    "phone": "<leader phone>"
  },
  "addedMember": null
}
```

When a member is accepted, the old snapshot is not changed. A new sequence is appended containing the new group state plus:

```json
{
  "addedMember": {
    "userId": "<new member UUID>",
    "name": "<member name>",
    "dateOfBirth": "<ISO date or null>",
    "email": "<member email>",
    "phone": "<member phone>"
  }
}
```

This produces an append-only history:

```text
sequence 1 -> group creation
sequence 2 -> first accepted member change
sequence 3 -> next accepted member change
...
```

## Exactly what `TrustAnchor.sol` stores

`DataSnapshot` contains:

```solidity
struct DataSnapshot {
    bytes32 payloadHash;
    bytes encryptedPayload;
    uint64 anchoredAt;
    uint32 sequence;
    uint8 snapshotType;
}
```

Snapshots are stored under:

```solidity
mapping(bytes32 => DataSnapshot[]) private dataSnapshots;
```

Therefore public-chain storage contains encrypted bytes and cryptographic/operational metadata, not plaintext PII.

The contract also stores hash-only evidence, incident and consent anchors where those flows are used.

## Why `ID_NOT_FOUND` happens

`appendDataSnapshot` requires that `ids[idHash]` already exists. Credential issuance must therefore succeed before the first snapshot is appended.

If a new `TrustAnchor` contract is deployed and `CONTRACT_ADDRESS` is changed, the new contract begins with empty storage. Old credential IDs remain on the old contract. Retrying an old snapshot against the new contract produces `ID_NOT_FOUND`. Create fresh credentials on the new deployment or implement an explicit migration/re-anchor strategy.

## Integrity reconciliation

The main backend runs `blockchainIntegrity.job.js` every five seconds.

For a confirmed credential it:

1. finds the latest snapshot job;
2. reads the latest on-chain snapshot;
3. requires the expected snapshot type;
4. decrypts ciphertext with `BLOCKCHAIN_DATA_ENCRYPTION_KEY`;
5. recomputes SHA-256 and compares it with on-chain `payloadHash`;
6. validates `idHash`, trip ID and user/group identity;
7. compares trusted values with PostgreSQL;
8. emits realtime integrity status;
9. repairs only fields for which automatic restoration is safe;
10. writes an audit record and emits final verification state.

Typical UI lifecycle:

```text
CHECKING -> APPROVED
APPROVED -> TAMPERED -> FIXING -> FIXED -> APPROVED
```

If the trusted snapshot cannot be safely read or validated:

```text
INTEGRITY_UNAVAILABLE
```

The UI must not claim approval in that state.

## Individual repair

The individual flow can restore protected name, DOB, email, phone and trip destination from the trusted snapshot. It records the tamper/recovery audit and pushes status to the affected tourist.

## Group repair

The group flow validates group name, destination and leader identity/contact values against the latest type-2 snapshot and publishes status to all active group members.

A member-count mismatch is detectable, but automatic repair is intentionally conservative. The latest snapshot contains the count and append event, not a complete authoritative active-membership table suitable for arbitrary deletion/reconstruction. The backend therefore must not invent or delete `GroupMember` rows solely to force the count to match.

## What blockchain does not do

Blockchain is not used for:

- live GPS points;
- responder live tracking;
- signal-loss timers;
- danger-zone calculations;
- email delivery;
- chatbot history;
- automatic emergency dispatch;
- mutable operational incident state.

Those remain in the normal backend/database/realtime services so a chain outage cannot block emergency behavior.

## Deployment requirements

The gateway and main backend must agree on the current snapshot-enabled contract address. The deployed contract must contain `appendDataSnapshot`, `getDataSnapshotCount`, `getLatestDataSnapshot` and `getDataSnapshot`.

Sepolia chain ID is `11155111`. Changing RPC providers does not change the contract address. Redeploying the Solidity contract does.

Main API requires a stable `BLOCKCHAIN_DATA_ENCRYPTION_KEY`. Gateway requires its RPC URL, issuer private key, contract address and gateway authentication configuration.

## Failure semantics

- `CONTRACT_REVERTED / ID_NOT_FOUND`: snapshot references an ID not issued in the current contract.
- `SNAPSHOT_NOT_FOUND`: no snapshot exists under that `idHash`.
- `INTEGRITY_UNAVAILABLE`: API cannot safely obtain/validate trusted snapshot data.
- gateway/RPC timeout: operational failure; core safety flow continues.
- hash mismatch/decryption failure/identity mismatch: never use the payload for DB repair.

Snapshot failure is intentionally independent of credential issuance status. A QR can remain blockchain-confirmed while its richer integrity snapshot is temporarily unavailable.

## 2026-08-27 integrity note

Operational cleanup of trips/incidents/dispatches is an application-database concern unless an explicit blockchain workflow records a corresponding credential/integrity event. Do not mirror rapidly changing GPS, dashboard counters, chatbot context, or other ephemeral UI state onto chain.

---

## Repository synchronization — 2026-08-27

Integrity handling must distinguish `verified`, `pending/unavailable`, and confirmed `mismatch` states. Group membership or identity updates can reach PostgreSQL before the latest blockchain snapshot is queryable; that temporary lag is not proof of corruption. Automatic repair remains blocked when the trusted snapshot is unavailable.
