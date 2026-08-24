# `blockchain/test/` — Setup Notes

> **Documentation status (24 Aug 2026):** Retained as design/deployment history. The current server integration uses the isolated authenticated HTTP gateway (`blockchain/gateway/server.ts`), not an in-process adapter import into `server/`.


This folder implements every test file specified in blueprint §8:

- `issueRevoke.test.ts` — digital ID issue/verify/revoke state machine
- `evidenceAnchor.test.ts` — evidence/incident/consent idempotent anchoring + access control
- `incidentAnchor.test.ts` — multi-snapshot incident timeline (CREATED → ASSIGNED → RESOLVED)
- `accessControl.test.ts` — admin/issuer authorization and revocation
- `idempotency.test.ts` — hash determinism regression + on-chain re-anchor idempotency
- `helpers/fixtures.ts` — shared Hardhat fixture (fresh contract per test) + small utilities
- `fixtures/canonicalHashes.json` — committed expected digests for the determinism regression test

## ⚠️ One required manual step before `idempotency.test.ts` is a true regression guard

`fixtures/canonicalHashes.json` currently contains **placeholder** `expectedHash`
values — this environment doesn't have your real `adapter/hasher.ts` /
`adapter/canonicalize.ts` implementations to execute against, so the digests
in that file are structurally-valid-looking but not the actual SHA-256
output of the given inputs.

**Before relying on the determinism tests, run this once against your real
adapter:**

```bash
cd blockchain
npx ts-node -e "
import { hashEvidenceManifest, hashIncidentSnapshot, hashConsentReceipt, hashIdPayload } from './adapter/hasher';
import fixtures from './test/fixtures/canonicalHashes.json';

console.log('evidenceManifest:', hashEvidenceManifest(
  fixtures.evidenceManifest.input.fileChecksumSha256,
  fixtures.evidenceManifest.input.actorId,
  fixtures.evidenceManifest.input.orgId,
  fixtures.evidenceManifest.input.transferredAt,
  fixtures.evidenceManifest.input.version
));

console.log('incidentSnapshot:', hashIncidentSnapshot(
  fixtures.incidentSnapshot.input.incidentId,
  fixtures.incidentSnapshot.input.state,
  fixtures.incidentSnapshot.input.transitionedAt,
  fixtures.incidentSnapshot.input.actorId,
  fixtures.incidentSnapshot.input.version
));

console.log('consentReceipt:', hashConsentReceipt(
  fixtures.consentReceipt.input.tripId,
  fixtures.consentReceipt.input.consentVersion,
  fixtures.consentReceipt.input.orgId,
  fixtures.consentReceipt.input.role,
  fixtures.consentReceipt.input.windowStart,
  fixtures.consentReceipt.input.windowEnd,
  fixtures.consentReceipt.input.version
));

console.log('idPayload:', hashIdPayload(
  fixtures.idPayload.input.touristIdSeq,
  fixtures.idPayload.input.tripId,
  fixtures.idPayload.input.version,
  fixtures.idPayload.input.salt
));
"
```

Paste the four printed digests into the corresponding `expectedHash` fields
in `fixtures/canonicalHashes.json`, replacing the placeholders. From then on,
any accidental change to `canonicalize.ts`/`hasher.ts` that alters digests
for existing data will fail this suite immediately.

## Other things to check against your real code

These tests were written strictly from the blueprint's documented function
signatures (contract in doc §2, adapter in doc §7). If your actual
implementation differs in small ways, expect only minor mechanical fixes:

- **Contract getter shapes**: `verifyId` is assumed to return
  `(status, issuer, issuedAt, expiresAt, version)` as a 5-tuple per §2/§7.4.
  If your Solidity omits `version` from the return, drop it from the
  destructuring in `issueRevoke.test.ts`.
- **`verifyEvidence`/`verifyIncident`** are assumed to return
  `(exists, anchoredAt)`; `verifyConsent` returns just `exists` (boolean,
  not a tuple) per §2. Adjust destructuring if yours differs.
- **Revert strings** (`"NOT_AUTHORIZED_ISSUER"`, `"NOT_ADMIN"`,
  `"ID_ALREADY_ISSUED"`, `"INVALID_WINDOW"`, `"ID_NOT_FOUND"`,
  `"ID_NOT_ACTIVE"`) are taken verbatim from §2. If you used different
  literal strings, update the `.revertedWith(...)` calls.
- **Adapter import path**: `idempotency.test.ts` imports from `"../adapter/hasher"`.
  Adjust if your actual folder structure differs from §0/§7.

## Running

```bash
cd blockchain
npx hardhat test                    # runs all files in test/
npx hardhat test test/idempotency.test.ts   # run a single file
```

`idempotency.test.ts` needs `ts-node` to resolve the `adapter/hasher.ts`
import the same way Hardhat resolves contract test files — this is already
covered by `@nomicfoundation/hardhat-toolbox` per config §6, no extra setup
needed if your `hardhat.config.ts` matches the blueprint.
