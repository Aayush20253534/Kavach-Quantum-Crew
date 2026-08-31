# Blockchain Test Suite

The `blockchain/test/` directory validates the Solidity trust layer and deterministic hashing behavior.

## Test files

| File | Focus |
|---|---|
| `issueRevoke.test.ts` | issue/verify/revoke credential state machine |
| `evidenceAnchor.test.ts` | evidence/consent anchoring and idempotency/access control |
| `incidentAnchor.test.ts` | incident snapshot anchoring |
| `accessControl.test.ts` | admin and authorized-issuer rules |
| `idempotency.test.ts` | deterministic hash fixtures and repeated anchoring |
| `fixtures.ts` | shared deployment/test helpers |
| `fixtures/canonicalHashes.json` | expected canonical-hash regression data |

## Run

```bash
cd blockchain
npm install
npm test
```

Hardhat deploys an isolated contract fixture for tests rather than depending on the public testnet.

## What should be asserted

### Credential lifecycle

- deployer starts as admin/issuer;
- issue creates ACTIVE record;
- duplicate issue of same `idHash` reverts;
- invalid expiry window reverts;
- extension requires ACTIVE record and later expiry;
- revocation requires ACTIVE record;
- verification reports the correct state;
- expiry is reflected through the contract's lazy-expiry view behavior.

### Access control

- unauthorized accounts cannot write anchors/credentials;
- admin can authorize/revoke issuers;
- non-admin cannot rotate issuers.

### Hash-only anchors

- evidence/incident/consent anchors verify after write;
- repeating the same anchor does not create an error;
- timestamps/existence values remain stable according to contract behavior.

### Snapshots

The current contract also contains append-only snapshot functions. Tests around production snapshot use should validate sequence enforcement, missing-snapshot reverts, latest-snapshot retrieval, and authorized-writer rules when extending the suite.

## Canonical-hash fixture caution

`idempotency.test.ts` relies on the committed values in `fixtures/canonicalHashes.json`. These values must be generated from the actual current `adapter/hasher.ts`/`canonicalize.ts` implementation. If placeholders or stale values remain, the test is not a meaningful regression guard.

To regenerate expected hashes, execute the current hash helpers against the fixture inputs and replace only the expected digest fields. Once committed, an accidental canonicalization change should make the test fail.

## Production-gateway coverage

Hardhat contract tests do not prove the HTTP gateway or main-backend Prisma queue works. Integration testing should separately cover:

```text
main backend
-> BlockchainAnchorJob
-> gateway auth/validation
-> RPC transaction
-> receipt
-> CONFIRMED job
-> credential verification
-> snapshot retrieval/integrity reconciliation
```

## Privacy checks

Run `adapter/privacyScan.ts` against the intended chain deployment as an additional release/demo guard. Contract tests and privacy scans test different things: unit rules versus deployed event/data shape.
