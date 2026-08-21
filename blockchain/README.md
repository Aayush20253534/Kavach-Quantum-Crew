# Blockchain Trust Layer — `blockchain/`

### SIH25002 — Smart Tourist Safety Monitoring & Incident Response System

This folder is the **trust anchor** for the platform: it proves that a
digital tourist ID, a piece of evidence, an incident timeline, or a
consent receipt existed and was not tampered with — without ever storing
the underlying personal data on-chain. PostgreSQL remains the source of
truth for everything operational; this folder only anchors hashes.

---

## 1. Why this exists — the non-negotiable rules

Before touching any code here, understand the seven invariants every file
in this folder is built around:

1. **The chain never stores** a name, phone number, identity document,
   GPS coordinate, photo/video byte, medical record, login credential, or
   free-text reason. Only a hash, a timestamp, a signer address, and a
   version tag ever go on-chain.
2. **Every hashed payload is canonicalized and versioned** before
   hashing — the same logical data always produces the same digest, and a
   future schema change never silently invalidates old proofs.
3. **Low-entropy identifiers are salted** before hashing (a short tourist
   ID or sequence number would otherwise be brute-forceable back from its
   digest).
4. **SOS and dispatch are never blocked on chain confirmation.** All
   chain writes are queued, asynchronous, and retried in the background;
   PostgreSQL is authoritative and immediate.
5. **Anchoring is idempotent.** Re-submitting a job for an
   already-anchored hash is a silent no-op — never a duplicate anchor,
   never an error shown to a user.
6. **Only the backend-controlled issuer account signs transactions.**
   Tourists never install a wallet, hold a key, or pay gas.
7. **A local Hardhat chain is the primary demo target.** A public testnet
   transaction is optional, secondary evidence only — it is never a hard
   dependency for tests or for judging.

If a change you're making would violate any of the above, stop and
reconsider before writing it — these rules are why this layer is trusted
at all.

---

## 2. Stack

- **Contract layer:** Solidity `^0.8.19` + Hardhat + ethers.js
- **Adapter layer:** TypeScript (no Python, no separate microservice) —
  imported directly into the Node/Express backend as an in-process module
- One `package.json`, one `node_modules`, one language above the Solidity
  boundary.

---

## 3. Local setup

From inside `blockchain/`:

```bash
npm install
```

This installs both the Hardhat toolchain (contracts, deploy scripts,
contract tests) and the adapter package (canonicalize, hasher,
chainClient, jobQueue, privacyScan) — there is only one install step for
the whole folder.

Copy the example environment file and fill in real values:

```bash
cp config/.env.example .env
```

---

## 4. Running a local chain

Start a persistent local Hardhat node in its own terminal:

```bash
npx hardhat node
```

Keep this running for the duration of your dev session or demo — it lets
deploy/issue/verify/revoke scripts share the same on-chain state across
multiple separate invocations, instead of resetting every time (which is
what the default in-memory `hardhat` network does).

---

## 5. Deploying the contract

Against the persistent local node started above:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

This compiles `TrustAnchor.sol`, deploys it, and writes deployment
metadata (contract address, deployer, block, contract version, ABI path)
to `blockchain/deployments/localhost.json`. Copy the printed
`CONTRACT_ADDRESS=` line into your `.env`.

---

## 6. Running the demo seed

One command sets up a fully deterministic, judge-ready state — no live
typing required during the actual demo:

```bash
npx ts-node scripts/seedDemo.ts
```

This deploys (if not already deployed), issues one fictional tourist ID
using the adapter's own hashing logic, and prints a demo cheat-sheet
(`idHash`, `tripHash`, status, expiry, QR payload) for the presenter to
reference live.

---

## 7. How the backend consumes this folder

The adapter is a normal TypeScript module — the Node/Express backend
imports it in-process, with no HTTP call, no second port, and no second
process to start:

```ts
import { enqueueAnchorEvidence, getJobStatus, hashEvidenceManifest } from "../../blockchain/adapter";
```

Route handlers compute a hash, call the matching `enqueue*` function, and
respond to the client immediately (Invariant 4). The background worker
loop (`jobQueue.runWorkerOnce`) is started once at backend process boot
via `setInterval` and handles actual chain submission/confirmation
asynchronously.

---

## 8. Running tests

Two test suites, one language:

```bash
# Contract-level tests (issue/revoke/verify, idempotency, access control)
npx hardhat test

# Adapter unit tests (canonicalize, hasher, job queue logic)
npx jest adapter
# or: npx vitest adapter
```

---

## 9. Running the privacy scan

Run this before every demo, and ideally in CI:

```bash
npx ts-node adapter/privacyScan.ts
```

This mechanically walks every emitted contract event and confirms
structurally — via the ABI, not just the decoded values — that no
PII/GPS/free-text field has ever reached the chain. See
`docs/on-chain-inspection-checklist.md` for the full checklist, including
the two steps that must be done manually.

---

## 10. Environment variables

| Variable | Purpose |
|---|---|
| `CHAIN_RPC_URL` | RPC endpoint of the target chain (local Hardhat node or optional testnet) |
| `CONTRACT_ADDRESS` | Deployed `TrustAnchor` address — filled in after running `deploy.ts` |
| `ISSUER_PRIVATE_KEY` | Private key of the backend-controlled signing account (never a tourist's key) |
| `CHAIN_ID` | Numeric chain ID of the target network (`31337` for local Hardhat) |
| `CONTRACT_VERSION` | Version tag stamped into every anchored payload, e.g. `trust-anchor-v1` |

Never commit `.env` with real values — only `config/.env.example` is
tracked in git.

---

## 11. Judge Q&A

If you're the one demoing this layer, the ready-made answers to the
questions judges actually ask ("why blockchain?", "what if the chain is
down?", "can identity be reconstructed from the chain?") live in the
source project blueprint, §13A / §18. Read those before presenting —
don't improvise an answer live.