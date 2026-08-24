# `blockchain/` — Trust Layer for SIH25002 (Smart Tourist Safety System)

This folder is the **blockchain trust layer**: it proves that a digital tourist ID, a piece of evidence, an incident timeline, or a consent receipt has not been tampered with — **without ever storing the underlying personal data on-chain.**

If you're the backend developer wiring this into `apps/api`, this document tells you everything you need: what the contract does, what the adapter exposes, what table you need to create, and the exact calls to make from your route handlers.

---

## 1. Core principle — read this before touching any code

> **The chain stores proofs, not data.**

The blockchain never holds a name, phone number, identity document, GPS coordinate, photo/video byte, medical record, or login credential. It holds exactly four kinds of thing: a **hash**, a **timestamp**, a **signer address**, and a **version tag**. Everything else — the real record — lives in PostgreSQL, exactly like every other table in this project.

Seven rules apply to every file in this folder. If you're ever unsure whether something belongs on-chain, check this list first:

1. The chain never stores raw PII, GPS, file bytes, or free-text reasons.
2. Every hashed payload is **canonicalized and versioned** before hashing — same logical data always produces the same digest.
3. Low-entropy identifiers (short tourist IDs, sequence numbers) are **salted** before hashing so they can't be brute-forced back.
4. **SOS and dispatch are never blocked on chain confirmation.** All chain writes go through an async queue.
5. Anchoring is **idempotent** — re-submitting a job for an already-anchored hash is a silent no-op, never a duplicate or an error.
6. Only the backend-controlled issuer account signs transactions. **Tourists never touch a wallet.**
7. A local Hardhat chain is the primary demo target. A public testnet is optional secondary evidence only.

---

## 2. Folder structure (what's already built)

```
blockchain/
├── contracts/
│   └── TrustAnchor.sol          ✅ done — the on-chain contract
├── scripts/                     ✅ done — CLI tools + deploy + demo seed
│   ├── deploy.ts
│   ├── issue.ts
│   ├── revoke.ts
│   ├── verify.ts
│   ├── anchorEvidence.ts
│   ├── anchorIncident.ts
│   └── seedDemo.ts
├── test/                        ✅ done — Hardhat contract test suite
│   ├── issueRevoke.test.ts
│   ├── evidenceAnchor.test.ts
│   ├── incidentAnchor.test.ts
│   ├── accessControl.test.ts
│   └── idempotency.test.ts
├── adapter/                     ✅ done — what YOU (backend) import
│   ├── index.ts
│   ├── canonicalize.ts
│   ├── hasher.ts
│   ├── chainClient.ts
│   ├── jobQueue.ts
│   ├── types.ts
│   └── privacyScan.ts
├── config/
│   ├── hardhat.config.ts
│   └── .env.example
├── deployments/
│   └── <network>.json           (generated when you deploy — not hand-written)
└── docs/
    └── on-chain-inspection-checklist.md
```

Everything above is TypeScript + Solidity. There is no Python anywhere in this folder — the adapter is a normal in-process module you `import`, not a separate service you call over HTTP.

---

## 3. What's already implemented — feature by feature

### 3.1 The contract (`TrustAnchor.sol`)

| Function | What it does | Who can call it |
|---|---|---|
| `issueId(idHash, tripHash, issuedAt, expiresAt, version)` | Anchors a new digital tourist ID proof. One-shot — same `idHash` can't be issued twice. | authorized issuer only |
| `revokeId(idHash, reasonCode)` | Marks an ID revoked. Only a numeric `reasonCode` is stored — no reason text ever touches the chain. | authorized issuer only |
| `verifyId(idHash)` | Read-only. Returns `status` (`ACTIVE`/`REVOKED`/`EXPIRED`), `issuer`, `issuedAt`, `expiresAt`, `version`. Applies **lazy expiry** — if the validity window has passed, it returns `EXPIRED` even if storage still says `ACTIVE`. | anyone (public verification) |
| `anchorEvidence(evidenceHash, version)` | Anchors a file checksum. **Idempotent** — calling it twice with the same hash is a silent no-op, not a revert. | authorized issuer only |
| `anchorIncident(incidentHash, version)` | Anchors one incident-timeline snapshot hash. Same idempotent pattern. | authorized issuer only |
| `anchorConsent(consentHash, version)` | Anchors a consent/access receipt hash. Same idempotent pattern. | authorized issuer only |
| `verifyEvidence` / `verifyIncident` / `verifyConsent` | Read-only existence + timestamp checks for the three anchor types above. | anyone |
| `authorizeIssuer(address)` / `revokeIssuer(address)` | Admin-only. Rotates which backend/agency key is allowed to sign. Lets a compromised key be retired without redeploying. | admin only |

Every state-changing function reverts with a specific string (`NOT_AUTHORIZED_ISSUER`, `ID_ALREADY_ISSUED`, `INVALID_WINDOW`, `ID_NOT_FOUND`, `ID_NOT_ACTIVE`, `NOT_ADMIN`) — your API error-handling layer should map these to sensible HTTP error codes.

### 3.2 The adapter (`adapter/`) — this is what you actually call

You will **never** call `chainClient.ts` or `ethers` directly from your route handlers. You call the queue functions in `jobQueue.ts`, and (for building payloads) the hash helpers in `hasher.ts`. Everything else is internal plumbing.

**Hashing helpers (`hasher.ts`) — call these to build a hash before enqueueing:**

| Function | Use it for |
|---|---|
| `hashIdPayload(touristIdSeq, tripId, version, salt)` | Digital ID issuance. `salt` is **required** here on purpose — you cannot accidentally skip salting a low-entropy tourist ID. |
| `hashEvidenceManifest(fileChecksumSha256, actorId, orgId, transferredAt, version)` | Evidence chain-of-custody anchoring. |
| `hashIncidentSnapshot(incidentId, state, transitionedAt, actorId, version)` | One incident-timeline state transition (call this once per transition — `CREATED`, `ASSIGNED`, `RESOLVED`, etc. each get their own hash). |
| `hashConsentReceipt(tripId, consentVersion, orgId, role, windowStart, windowEnd, version)` | Consent/access receipts. |

**Queue functions (`jobQueue.ts`) — call these from your route handlers:**

| Function | Returns | What it does |
|---|---|---|
| `enqueueIssueId(idHash, tripHash, issuedAt, expiresAt, version)` | `jobId` | Inserts a `PENDING` job row. Does **not** touch the chain. Returns instantly. |
| `enqueueRevokeId(idHash, reasonCode)` | `jobId` | Same pattern. |
| `enqueueAnchorEvidence(evidenceHash, version)` | `jobId` | Same pattern. |
| `enqueueAnchorIncident(incidentHash, version)` | `jobId` | Same pattern. |
| `enqueueAnchorConsent(consentHash, version)` | `jobId` | Same pattern. |
| `getJobStatus(jobId)` | `AnchorJob` | Read-only. Returns `state: "PENDING" \| "CONFIRMED" \| "FAILED"` plus `txHash`, `attempts`, `lastError`. This is what you call to show status in the UI. |
| `runWorkerOnce()` | summary | The background loop. You call this on a `setInterval`, not from a request handler. |

**Privacy self-check (`privacyScan.ts`):**

| Function | What it does |
|---|---|
| `scanRecentEvents(chainClient, sinceBlock?)` | Scans every emitted event since a block and structurally verifies no field is a string/variable-length type — i.e., mechanically proves no PII/GPS ever got anchored. Run before every demo. |

### 3.3 Scripts (`scripts/`) — for you to run manually, not to import

These are CLI tools, not library code:
- `deploy.ts` — deploys the contract, writes `deployments/<network>.json`.
- `issue.ts` / `revoke.ts` / `verify.ts` / `anchorEvidence.ts` / `anchorIncident.ts` — one-off manual operations for testing/demo without going through the API.
- `seedDemo.ts` — deploys (if needed) and issues one fixed, deterministic fictional tourist ID for the judge demo. Run this once before rehearsal.

---

## 4. Integration guide — exactly what you need to do

### Step 1 — Install dependencies

```bash
cd blockchain
npm install
```

### Step 2 — Create your `.env`

Copy `config/.env.example` to `.env` in `blockchain/` and fill in:

```
CHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=            # filled in after you deploy — see Step 4
ISSUER_PRIVATE_KEY=          # a throwaway Hardhat test account key, never a real key
CHAIN_ID=31337
CONTRACT_VERSION=trust-anchor-v1
```

The **same** `CONTRACT_ADDRESS`, `CHAIN_RPC_URL`, etc. also need to be readable by the main API process — either point the API's own `.env` at the same values, or have your app config load `blockchain/.env` directly.

### Step 3 — Start a local chain

```bash
npx hardhat node
```

Leave this running in its own terminal for the whole session — this is the persistent `localhost` network, not the throwaway `hardhat` network the test suite uses.

### Step 4 — Deploy the contract

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

This writes `deployments/localhost.json` and prints the contract address — copy it into `CONTRACT_ADDRESS` in your `.env`.

### Step 5 — Add the job-queue table to your Prisma schema

The adapter's `jobQueue.ts` reads/writes a table it does **not** own — you own this migration. Add something equivalent to:

```prisma
model BlockchainAnchorJob {
  id          String   @id @default(uuid())
  anchorType  String   // "ID_ISSUE" | "ID_REVOKE" | "EVIDENCE" | "INCIDENT" | "CONSENT"
  payloadHash String
  extraArgs   Json
  state       String   // "PENDING" | "CONFIRMED" | "FAILED"
  txHash      String?
  attempts    Int      @default(0)
  createdAt   DateTime @default(now())
  lastError   String?
}
```

Run `npx prisma migrate dev` after adding this. This is the same table the source blueprint calls out as living "in PostgreSQL alongside the record it anchors" — the transaction hash, chain, and confirmation status all live here, not just on-chain.

### Step 6 — Import the adapter into your Express app

```ts
import {
  hashEvidenceManifest,
  enqueueAnchorEvidence,
  getJobStatus,
} from "../../blockchain/adapter";
```

No separate process, no port, no HTTP call — this is a plain module import.

### Step 7 — Start the worker loop once, at server boot

In your `server.ts` (or wherever Express starts listening):

```ts
import { runWorkerOnce } from "../../blockchain/adapter";

setInterval(() => {
  runWorkerOnce().catch((err) => console.error("anchor worker error:", err));
}, 5000);
```

This is what actually submits queued jobs to the chain and polls for confirmation. Without this line, jobs will sit in `PENDING` forever.

### Step 8 — Wire up your route handlers

Pattern to follow for **every** anchor type — enqueue, respond immediately, never await the chain:

```ts
// Example: POST /incidents/:id/evidence
app.post("/incidents/:id/evidence", async (req, res) => {
  // ... save the actual evidence file + metadata to Postgres/object storage first ...

  const hash = hashEvidenceManifest(
    fileChecksumSha256,
    actorId,
    orgId,
    Math.floor(Date.now() / 1000),
    1 // version
  );

  const jobId = await enqueueAnchorEvidence(hash, 1);

  // Store jobId on your EvidenceFile/EvidenceHash row so you can look up
  // status later.

  res.json({ success: true, evidenceHash: hash, anchorJobId: jobId });
  // Note: we already responded — the chain confirmation happens async.
});
```

```ts
// Example: GET /incidents/:id  (show anchor status to the dispatcher)
const job = await getJobStatus(record.anchorJobId);
// job.state is "PENDING" | "CONFIRMED" | "FAILED" — show this directly,
// never hide a pending anchor.
```

Apply the same enqueue → respond → poll-status pattern for:
- Digital ID issuance/revocation (`enqueueIssueId` / `enqueueRevokeId`)
- Incident timeline transitions (`enqueueAnchorIncident`, once per state change)
- Consent grants/revocations (`enqueueAnchorConsent`)

### Step 9 — Digital ID verification endpoint (read path, no queue needed)

Verification is synchronous and read-only — call `ChainClient.verifyId` directly (or wrap it in a thin adapter function if one isn't already exported) since there's nothing to queue:

```json
{
  "idHash": "0x7f3a...c21",
  "status": "ACTIVE",
  "issuer": "0xEntryPointOperator...",
  "issuedAt": "2026-08-19T09:00:00Z",
  "expiresAt": "2026-08-26T09:00:00Z",
  "chain": "hardhat-local",
  "contractVersion": "trust-anchor-v1"
}
```

This is the exact response shape to return from `GET /digital-ids/:publicId/verify`.

---

## 5. Testing

```bash
npx hardhat test              # contract-level tests (test/*.test.ts)
npx jest adapter               # adapter unit tests, if kept separate
```

What the contract test suite already proves (so you know what NOT to re-test at the API layer):
- Issue → verify → revoke → verify-again state machine, including lazy expiry after time-travel.
- Anchoring the same evidence/incident/consent hash twice never double-anchors and never reverts.
- Unauthorized callers are rejected on every state-changing function.
- Admin-only issuer authorization/revocation.
- Hash-determinism regression guard (a fixed payload always produces the same digest).

---

## 6. Failure handling — what happens when the chain is down

This is already handled inside `jobQueue.ts` — you don't need to build retry logic yourself:
- Chain node unreachable → job stays `PENDING`, retried on the next 5-second tick.
- Submission fails repeatedly → after ~5 attempts, job is marked `FAILED` and stops auto-retrying (surfaced in `getJobStatus` for manual re-submission).
- A crash between "tx confirmed on-chain" and "local row updated" is self-healing: before resubmitting, the worker re-checks on-chain state (`verifyEvidence`/etc.) and marks the job `CONFIRMED` without sending a duplicate transaction.

**Your only obligation:** never make SOS creation, incident dispatch, or incident closure wait on `getJobStatus` returning `CONFIRMED`. Those operations complete against PostgreSQL immediately; the anchor is a background follow-up, always.

---

## 7. Pre-demo checklist

Run before every rehearsal and before judging:

```bash
npx ts-node scripts/seedDemo.ts        # deterministic demo identity
npx ts-node adapter/privacyScan.ts     # confirms no PII/GPS ever anchored
```

Full manual checklist: `docs/on-chain-inspection-checklist.md`.

---

## 8. Judge Q&A cheat sheet

| Question | Answer |
|---|---|
| Why blockchain? | Only for tamper-evident ID/evidence hashes across organizations. All operational data stays in PostgreSQL. |
| What if the chain is down? | Async queue, visible `PENDING` status — SOS and dispatch are never blocked. |
| Is government integration live? | No — documented adapters and mocks only. |
| Can a tourist's identity be reconstructed from the chain? | No — only salted hashes and validity windows are anchored, never the underlying document or PII. |
| Why TypeScript, not a separate service? | The adapter runs in-process inside the same Node backend — one language, one deploy target, no extra network hop. |

---

## 9. Environment variables reference

| Variable | Set by | Used by |
|---|---|---|
| `CHAIN_RPC_URL` | you, in `.env` | `chainClient.ts`, all `scripts/*.ts` |
| `CONTRACT_ADDRESS` | `scripts/deploy.ts` output | `chainClient.ts` |
| `ISSUER_PRIVATE_KEY` | you, in `.env` (Hardhat test key only) | `chainClient.ts`, `scripts/*.ts` |
| `CHAIN_ID` | you, in `.env` | `hardhat.config.ts`, `chainClient.ts` |
| `CONTRACT_VERSION` | you, in `.env` | `chainClient.ts`, `hasher.ts` callers |

---

**If something isn't covered here, check the full implementation blueprint document first — every function in this folder is traceable back to a specific section there. Don't improvise new on-chain fields; update the blueprint first.**
## Internal gateway used by `server/`

The production-style integration now uses `gateway/server.ts`. This is a deliberately small authenticated HTTP boundary around the signer. It lets `server/` and `blockchain/` remain independently installable/deployable while keeping `ISSUER_PRIVATE_KEY` inside the blockchain runtime.

Run locally after deploying the contract:

```bash
cp .env.example .env
npm run node
npm run deploy:localhost
# copy the deployed address into CONTRACT_ADDRESS, then:
npm run gateway
```

The server sends `ISSUE`, `EXTEND`, and `REVOKE` jobs to the gateway. `GET /v1/credentials/:idHash` performs read-only verification. `TrustAnchor.extendId` was added so extending a trip preserves the same credential hash while moving its expiry forward.
