# Blockchain Trust Model and Extension Guide

This is a design guide for the current implementation, not a release chronology.

## 1. Core principle

Use blockchain only where an independently verifiable, append-only/tamper-evident record adds value. Do not move ordinary application CRUD onto the chain merely because a contract exists.

```text
fast/private/changeable operational state -> PostgreSQL
verification proof / historical trust anchor -> blockchain
```

## 2. Current production priorities

The live gateway/backend path prioritizes:

- trip credential trust state;
- group/individual credential snapshots;
- integrity reconciliation.

The contract/adapter also contains evidence, incident, and consent proof primitives that can be activated through explicit integration work.

## 3. Adding a new on-chain proof

Before adding a feature, define:

1. the exact off-chain source record;
2. the deterministic canonical payload;
3. whether salting is required;
4. which fields are forbidden on-chain;
5. whether only a hash is needed or encrypted historical data is justified;
6. idempotency semantics;
7. retry semantics;
8. verification response;
9. authorization role;
10. what happens when the chain is unavailable.

## 4. Default to hash-only proofs

For evidence/incident/consent, hash-only anchoring is the safer default. Encrypted on-chain data should be used only when recovery/integrity requirements justify permanent ciphertext publication.

## 5. Keep signing isolated

New backend features should call the authenticated gateway rather than importing a wallet/private key into unrelated application processes. This keeps the blast radius of a backend compromise smaller and makes signer rotation clearer.

## 6. Preserve asynchronous behavior

A blockchain outage should not prevent a tourist from creating a valid application record when the domain workflow can safely continue. Persist the domain transaction and queue the trust operation.

Only workflows that mathematically require chain confirmation before proceeding should block on-chain state.

## 7. Version everything that affects hashes

Canonical schema or encryption changes must be versioned. Never silently change serialization and expect historical hashes to remain reproducible.

## 8. Integrity restoration rules

Automatic restoration should happen only when the trusted snapshot contains enough information to make the repair unambiguous. Detection is not the same as safe repair.

The current group member-count rule is a useful example: a count mismatch proves drift but does not identify which member records are wrong, so destructive repair is withheld.

## 9. Key rotation

Plan separately for:

- issuer wallet rotation through `authorizeIssuer`/`revokeIssuer`;
- gateway API key rotation;
- snapshot encryption-key rotation/versioning.

Changing the encryption key without preserving the ability to decrypt historical snapshots would destroy the integrity-recovery value of existing ciphertext.

## 10. Test requirements for extensions

Every new proof type should cover:

- authorized vs unauthorized caller;
- deterministic hashing fixture;
- happy-path anchor + verify;
- idempotent retry;
- RPC/timeout behavior;
- privacy scan expectations;
- version compatibility;
- backend queue state transitions.
