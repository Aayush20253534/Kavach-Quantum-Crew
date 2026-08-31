# Blockchain Data Storage and Integrity

## 1. Storage split

KAVACH intentionally uses two storage classes.

### PostgreSQL stores operational application data

Examples:

- account/profile records;
- trip/group membership state;
- QR credential rows and token IDs;
- incidents/dispatches;
- blockchain job state/error metadata;
- normal application audit/notification data.

### Blockchain stores trust material

`TrustAnchor.sol` stores:

- `DigitalId` records keyed by hash;
- append-only encrypted `DataSnapshot[]` per ID hash;
- evidence hash existence/timestamp;
- incident hash existence/timestamp;
- consent hash existence/timestamp;
- authorized issuer map/admin address.

## 2. Credential fields on-chain

For each `idHash`:

```text
tripHash
issuedAt
expiresAt
status
issuer
version
```

The contract does not need the QR token, local public ID, tourist password, or raw trip database row to verify this trust state.

## 3. Snapshot fields on-chain

A `DataSnapshot` contains:

```text
payloadHash       bytes32
 encryptedPayload bytes
anchoredAt        uint64
sequence          uint32
snapshotType      uint8
```

The ciphertext is append-only because each new snapshot must use exactly the next sequence.

## 4. Snapshot plaintext before encryption

The main backend currently builds meaningful application snapshots.

### Individual snapshot example

```text
schema
idHash
tripId
userId
name
dateOfBirth
destination
phone
email
```

### Group snapshot example

```text
schema
idHash
groupId
tripId
groupName
memberCount
destination
leader contact fields
optional addedMember fields
```

These plaintext fields are **not submitted to the contract as plaintext**. The backend hashes and encrypts the snapshot before gateway submission.

## 5. Hash integrity

A snapshot is trusted only when the decrypted content re-hashes to the `payloadHash` recorded with the on-chain snapshot. That gives the reconciliation layer a direct tamper check for the ciphertext/plaintext relationship.

## 6. Encryption boundary

Snapshot encryption/decryption occurs in the main backend using `BLOCKCHAIN_DATA_ENCRYPTION_KEY`. The gateway receives ciphertext and does not need the decryption key.

Therefore:

```text
main backend: plaintext + encryption key
blockchain gateway: ciphertext + chain signing key
public chain: ciphertext + payload hash
frontend: neither secret
```

This is deliberate secret separation.

## 7. Integrity restoration

For supported individual/group fields, the main backend can treat a verified latest snapshot as the trusted historical value and restore PostgreSQL when drift is detected.

Restoration occurs only after:

- a snapshot job exists;
- an on-chain snapshot is readable;
- the snapshot type is correct;
- the ciphertext decrypts;
- its hash matches;
- embedded credential identity matches.

If any trust prerequisite fails, integrity is not approved.

## 8. What is not auto-restored

Group membership-count drift is not enough to reconstruct exact membership safely. The integrity service reports the discrepancy and avoids guessing which rows to mutate.

This is an important principle: blockchain proof can show that state changed, but it does not automatically make an underspecified repair safe.

## 9. Evidence/incident/consent proof storage

Those contract maps contain only hash existence and first-anchor timestamp (consent verification exposes existence). Actual evidence bytes, incident descriptions, and consent documents remain off-chain.

## 10. Privacy considerations

Hashing reduces direct disclosure but is not magic anonymization for low-entropy inputs. The adapter's `hashIdPayload()` therefore requires salting for low-entropy IDs.

Encrypted snapshot bytes are publicly retrievable on a public chain. Protect `BLOCKCHAIN_DATA_ENCRYPTION_KEY` carefully, rotate via an explicit versioned design rather than silently, and do not put plaintext secrets inside events.

## 11. Privacy scanner

The scanner checks event structure and values, but snapshots are intentionally a special case because `DataSnapshotAnchored` does not itself emit ciphertext. The contract stores ciphertext in storage and the event emits its hash/sequence/type metadata.

Privacy scanning is a guardrail around accidental plaintext exposure, not formal proof that all encryption/key-management choices are perfect.
