# `blockchain/` Folder — Full By-Code Implementation Blueprint
### SIH25002 — Smart Tourist Safety Monitoring & Incident Response System
### Single Source of Truth for the Blockchain Trust Layer

> This document is **not code**. It is the complete functional specification for every file that must exist inside the `blockchain/` folder (at the repo root, alongside `apps/`, `packages/`, `prisma/`). Anyone — human or AI — should be able to implement the actual code from this document alone, with no other reference needed. Every file below states: its purpose, its exact inputs/outputs, its internal logic step-by-step, its error conditions, and how it's tested.
>
> **Stack for this version:** Solidity + Hardhat + ethers.js for the contract layer, and **TypeScript** (not Python) for the adapter layer, so the same backend developer who owns Node/Express can read and maintain the entire `blockchain/` folder without a language switch.

---

## 0. Folder Layout (target state)

```
blockchain/
├── contracts/
│   └── TrustAnchor.sol
├── scripts/
│   ├── deploy.ts
│   ├── issue.ts
│   ├── revoke.ts
│   ├── verify.ts
│   ├── anchorEvidence.ts
│   ├── anchorIncident.ts
│   └── seedDemo.ts
├── test/
│   ├── issueRevoke.test.ts
│   ├── evidenceAnchor.test.ts
│   ├── incidentAnchor.test.ts
│   ├── accessControl.test.ts
│   └── idempotency.test.ts
├── adapter/
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
│   └── <network>.json                (generated at deploy time — not hand-written)
├── docs/
│   └── on-chain-inspection-checklist.md
└── README.md
```

**Language note:** Everything in `blockchain/` is now JavaScript/TypeScript end to end — contracts in Solidity (unavoidable), everything else in TypeScript. The `adapter/` package is imported **directly** into the Node/Express backend as a regular internal module (no separate microservice, no HTTP boundary, no second process to run or deploy). This is simpler than a cross-language design: one runtime, one package manager, one person can own the whole folder.

---

## 1. Design Invariants (apply to every file below — restated once, binding everywhere)

1. **The chain never stores:** name, phone number, identity document, GPS coordinate, photo/video byte, medical record, login credential, or free-text reason. Only: a hash, a timestamp, a signer address, and a version tag.
2. **Every hashed payload is canonicalized and versioned** before hashing — same logical data always produces the same digest, and a schema change never silently invalidates old proofs.
3. **Low-entropy identifiers are salted** before hashing (a short tourist ID or sequence number is brute-forceable otherwise).
4. **SOS and dispatch are never blocked on chain confirmation.** All chain writes are queued, asynchronous, and retried; the operational workflow (PostgreSQL) is authoritative and immediate.
5. **Idempotent anchoring.** Re-submitting a job for an already-anchored hash is a silent no-op, never a duplicate anchor or an error surfaced to the user.
6. **Only the backend-controlled issuer account signs transactions.** Tourists never touch a wallet, key, or gas fee.
7. **Local Hardhat chain is the primary demo target.** A public testnet transaction is optional secondary evidence only — never a hard dependency for judging or for tests to pass.

---

## 2. `contracts/TrustAnchor.sol`

### Purpose
The single on-chain contract. Stores only hashes/timestamps/status for three anchor types: digital IDs, evidence files, and incident timelines (plus consent receipts). No PII, ever, at the Solidity level — enforced structurally by only accepting `bytes32` hash parameters, never strings or arbitrary bytes.

### Solidity version & tooling
- `pragma solidity ^0.8.19;`
- No external dependencies required beyond plain Solidity. OpenZeppelin `AccessControl` is an acceptable optional swap for the hand-rolled `onlyAuthorizedIssuer` modifier if the team wants a more auditable pattern, but is not required.

### State variables

```
enum IdStatus { ACTIVE, REVOKED, EXPIRED }

struct DigitalId {
    bytes32 tripHash;
    uint64  issuedAt;
    uint64  expiresAt;
    IdStatus status;
    address issuer;
    uint8   version;
}

mapping(bytes32 => DigitalId) public ids;                 // idHash => record
mapping(bytes32 => bool)      public evidenceAnchors;      // evidenceHash => exists
mapping(bytes32 => uint64)    public evidenceAnchoredAt;   // evidenceHash => block timestamp
mapping(bytes32 => bool)      public incidentAnchors;      // incidentHash => exists
mapping(bytes32 => uint64)    public incidentAnchoredAt;   // incidentHash => block timestamp
mapping(bytes32 => bool)      public consentAnchors;       // consentHash => exists

mapping(address => bool) public authorizedIssuers;         // issuer allow-list
address public admin;                                       // deployer / rotates issuers
```

### Events (every one must be emitted — the adapter's PENDING→CONFIRMED transition reads these)

```
event IdIssued(bytes32 indexed idHash, bytes32 indexed tripHash, address indexed issuer, uint64 issuedAt, uint64 expiresAt, uint8 version);
event IdRevoked(bytes32 indexed idHash, uint8 reasonCode, address indexed revoker, uint64 revokedAt);
event EvidenceAnchored(bytes32 indexed evidenceHash, address indexed actor, uint64 anchoredAt, uint8 version);
event IncidentAnchored(bytes32 indexed incidentHash, address indexed actor, uint64 anchoredAt, uint8 version);
event ConsentAnchored(bytes32 indexed consentHash, address indexed actor, uint64 anchoredAt, uint8 version);
event IssuerAuthorized(address indexed issuer);
event IssuerRevoked(address indexed issuer);
```

### Functions — exact behavior

**`constructor()`**
- Sets `admin = msg.sender`.
- Authorizes `msg.sender` as the first issuer (so the deploying backend account can immediately call `issueId` etc. without a second transaction).

**`modifier onlyAuthorizedIssuer()`**
- Reverts with `"NOT_AUTHORIZED_ISSUER"` unless `authorizedIssuers[msg.sender] == true`.

**`modifier onlyAdmin()`**
- Reverts with `"NOT_ADMIN"` unless `msg.sender == admin`.

**`function authorizeIssuer(address issuer) external onlyAdmin`**
- Sets `authorizedIssuers[issuer] = true`. Emits `IssuerAuthorized`.
- Purpose: lets the demo rotate/retire the backend signing key without redeploying, and satisfies the blueprint's "agency/key revocation registry" requirement.

**`function revokeIssuer(address issuer) external onlyAdmin`**
- Sets `authorizedIssuers[issuer] = false`. Emits `IssuerRevoked`.

**`function issueId(bytes32 idHash, bytes32 tripHash, uint64 issuedAt, uint64 expiresAt, uint8 version) external onlyAuthorizedIssuer`**
- Requires `ids[idHash].issuer == address(0)` — reverts `"ID_ALREADY_ISSUED"` otherwise (issuance is one-shot; re-issuance after revoke uses a **new** `idHash`, not an overwrite — this preserves history).
- Requires `expiresAt > issuedAt` — reverts `"INVALID_WINDOW"` otherwise.
- Writes the struct with `status = ACTIVE`.
- Emits `IdIssued`.

**`function revokeId(bytes32 idHash, uint8 reasonCode) external onlyAuthorizedIssuer`**
- Requires `ids[idHash].issuer != address(0)` — reverts `"ID_NOT_FOUND"`.
- Requires `ids[idHash].status == IdStatus.ACTIVE` — reverts `"ID_NOT_ACTIVE"` (no double-revoke).
- Sets `status = REVOKED`.
- Emits `IdRevoked` with the reason **code** only (never text — text stays in PostgreSQL per Invariant 1).

**`function verifyId(bytes32 idHash) external view returns (IdStatus status, address issuer, uint64 issuedAt, uint64 expiresAt, uint8 version)`**
- Read-only. No auth required at the contract level (the backend restricts *who can call the API endpoint*; the contract itself is a public verification surface by design — that's the point of an inter-agency proof).
- If `ids[idHash].issuer == address(0)`: returns all-zero/default values — the **caller (backend)** is responsible for translating that into a "NOT_FOUND" API response, not the contract.
- If `block.timestamp > expiresAt` and `status == ACTIVE`: this function does **not** mutate state (view functions can't), so it computes and returns `IdStatus.EXPIRED` in the return value even though storage still says `ACTIVE` — the lazy-expiry pattern. (A separate non-view `sweepExpired(idHash)` is optional/out of scope for MVP; the recompute-on-read pattern is sufficient for the demo.)

**`function anchorEvidence(bytes32 evidenceHash, uint8 version) external onlyAuthorizedIssuer`**
- If `evidenceAnchors[evidenceHash] == true`: **return silently, do nothing** (idempotent — Invariant 5). Do not revert.
- Else: sets `evidenceAnchors[evidenceHash] = true`, `evidenceAnchoredAt[evidenceHash] = uint64(block.timestamp)`. Emits `EvidenceAnchored`.

**`function anchorIncident(bytes32 incidentHash, uint8 version) external onlyAuthorizedIssuer`**
- Same idempotent pattern as `anchorEvidence`, targeting `incidentAnchors`/`incidentAnchoredAt`. Emits `IncidentAnchored`.

**`function anchorConsent(bytes32 consentHash, uint8 version) external onlyAuthorizedIssuer`**
- Same idempotent pattern, targeting `consentAnchors`. Emits `ConsentAnchored`.

**`function verifyEvidence(bytes32 evidenceHash) external view returns (bool exists, uint64 anchoredAt)`**
**`function verifyIncident(bytes32 incidentHash) external view returns (bool exists, uint64 anchoredAt)`**
**`function verifyConsent(bytes32 consentHash) external view returns (bool exists)`**
- Trivial read-only lookups mirroring `verifyId`'s pattern.

### Explicit non-goals inside the contract
- No storage of file bytes, notes, or any string field anywhere.
- No tourist-facing function — every state-changing function is `onlyAuthorizedIssuer`.
- No upgradability proxy pattern for MVP (Invariant: "version the contract; old anchors remain independently verifiable under their version" — this is handled by redeploying and recording the new address in `deployments/<network>.json`, not by a proxy).

---

## 3. `scripts/deploy.ts`

### Purpose
Deploys `TrustAnchor.sol` to whichever network Hardhat is pointed at (local Hardhat node by default; testnet optional/secondary per Invariant 7) and writes deployment metadata to disk for the rest of the app to consume. Written against `hardhat` + `ethers` using Hardhat's built-in TypeScript support (`ts-node` + `@nomicfoundation/hardhat-toolbox`).

### Inputs
- Reads `CHAIN_RPC_URL`, `ISSUER_PRIVATE_KEY`, `CHAIN_ID` from environment (via `config/.env.example` → real `.env`, never committed).
- Reads the target network name from the Hardhat `--network` CLI flag.

### Logic
1. Compile the contract (Hardhat does this automatically on `run`).
2. Get the deployer signer from `ISSUER_PRIVATE_KEY`.
3. Deploy `TrustAnchor` with no constructor arguments.
4. Wait for the deployment transaction to be mined.
5. Read back `admin` and confirm it equals the deployer address (sanity check — abort with a clear error if not).
6. Write a JSON file to `blockchain/deployments/<network>.json`:
   ```json
   {
     "network": "hardhat-local",
     "chainId": 31337,
     "contractAddress": "0x...",
     "deployerAddress": "0x...",
     "deployedAtBlock": 123,
     "deployedAtTimestamp": "2026-08-21T09:00:00Z",
     "contractVersion": "trust-anchor-v1",
     "abiPath": "./artifacts/contracts/TrustAnchor.sol/TrustAnchor.json"
   }
   ```
7. Print the contract address and a copy-pasteable `CONTRACT_ADDRESS=` line to stdout for the backend `.env`.

### Output
- The deployment JSON file (consumed by `adapter/chainClient.ts`, see §7).
- Non-zero exit code and a clear stderr message on any failure (RPC unreachable, insufficient funds, compile error).

---

## 4. `scripts/issue.ts`, `scripts/revoke.ts`, `scripts/verify.ts`, `scripts/anchorEvidence.ts`, `scripts/anchorIncident.ts`

### Purpose
Thin, **standalone, demo-runnable** CLI scripts that each perform exactly one contract operation, for use in (a) the judge-facing demo drill, (b) manual smoke-testing without booting the whole backend, and (c) as a living reference for the adapter's own transaction-building logic — since both now live in the same language, these scripts and `adapter/chainClient.ts` can literally share the same ethers.js call helpers via a small shared module if desired (optional refactor, not required for MVP).

Each script:
- Loads `deployments/<network>.json` to get the contract address + ABI path.
- Connects with `ethers.js` using `CHAIN_RPC_URL` + `ISSUER_PRIVATE_KEY`.
- Accepts its specific arguments via CLI flags so they're runnable in isolation: `npx ts-node scripts/issue.ts --idHash 0x... --tripHash 0x... --expiresInHours 168`.
- Prints a structured JSON result to stdout (`{ "txHash": "...", "status": "CONFIRMED", ... }`) so it can be piped/parsed by a shell demo runner.

**`issue.ts`** — computes `issuedAt = now`, `expiresAt = now + expiresInHours`, calls `issueId`, waits for 1 confirmation, prints the emitted `IdIssued` event fields.

**`revoke.ts`** — calls `revokeId(idHash, reasonCode)`, prints the emitted `IdRevoked` fields.

**`verify.ts`** — calls the **view** function `verifyId(idHash)` (no gas, no wait), prints status/issuer/window in the exact JSON shape from §6/§13 of the source blueprint (`idHash`, `status`, `issuer`, `issuedAt`, `expiresAt`, `chain`, `contractVersion`).

**`anchorEvidence.ts`** / **`anchorIncident.ts`** — accept the pre-computed hash (these scripts do **not** hash — hashing happens in `adapter/hasher.ts`, §7 — they only anchor a hash you already have), call the respective anchor function, print the emitted event and idempotency outcome (`"alreadyAnchored": true/false`).

---

## 5. `scripts/seedDemo.ts`

### Purpose
One-command deterministic setup for the judge demo: deploys (if not already deployed), issues one fictional tourist ID, leaves it active, and prints every value needed to drive the 5-minute demo runbook (§13 of the source blueprint) — so the demo never depends on live typing.

### Logic
1. Run (or detect an existing) deployment.
2. Compute a deterministic `idHash`/`tripHash` from fixed demo seed data (fictional tourist, fixed trip ID) by importing and calling `adapter/hasher.ts` directly — since the script and the adapter are the same language, there is exactly **one** hashing implementation in the whole codebase, eliminating any risk of the demo script and the backend computing different digests for the same logical data.
3. Calls `issueId`.
4. Prints a demo cheat-sheet block:
   ```
   DEMO IDENTITY
   idHash:      0x...
   tripHash:    0x...
   status:      ACTIVE
   expiresAt:   2026-08-28T09:00:00Z
   QR payload:  { "idHash": "0x...", "verifyUrl": ".../digital-ids/0x.../verify" }
   ```

### Output
A fixed, reproducible on-chain state the whole team can rely on for rehearsal, matching the "reset script; deterministic backup" requirement from the source blueprint's delivery gates.

---

## 6. `config/hardhat.config.ts` and `config/.env.example`

### `hardhat.config.ts`
- Declares two networks: `hardhat` (in-memory, default — instant blocks, no config needed) and `localhost` (persistent local node via `npx hardhat node`, used so the backend can stay connected across script runs during a live demo).
- Optionally declares a `testnet` network entry reading `CHAIN_RPC_URL`/`ISSUER_PRIVATE_KEY`/`CHAIN_ID` from env — commented out / clearly marked optional, consistent with Invariant 7.
- Solidity compiler version pinned to match the contract's pragma (`0.8.19`), optimizer enabled (low `runs` value is fine — this contract is tiny).
- TypeScript support enabled via `@nomicfoundation/hardhat-toolbox` (bundles ethers, chai matchers, typechain type generation) — `typechain` output feeds typed contract bindings straight into `adapter/chainClient.ts`, so the adapter gets compile-time-checked function signatures instead of untyped ABI calls.

### `.env.example`
```
CHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=
ISSUER_PRIVATE_KEY=
CHAIN_ID=31337
CONTRACT_VERSION=trust-anchor-v1
```
- Never committed with real values; `.env` is gitignored. This file exists purely as the documented contract for what the backend/adapter expects to find in the environment (matches the source blueprint's §10 env inventory exactly).

---

## 7. TypeScript Adapter Package — `blockchain/adapter/`

This is the layer the Node/Express backend calls **in-process** — imported as a normal local package (e.g. `import { enqueueAnchorEvidence } from "../../blockchain/adapter"` or published internally as a workspace package if the repo uses a monorepo tool like `pnpm`/`turborepo`). It owns canonicalization, hashing, salting, transaction submission, async state tracking, retries, and the privacy self-check. No separate process, no HTTP boundary, no second language — the backend's Express route handlers call these functions directly and `await` only the fast, synchronous "enqueue" part; the actual chain confirmation happens on a background interval within the same Node process (or a small worker script sharing the same codebase).

### 7.1 `adapter/canonicalize.ts`

**Purpose:** Deterministic, versioned JSON canonicalization — the single function every other module hashes through, so two callers of the same logical payload always produce byte-identical input to SHA-256.

**Function: `canonicalize(payload: Record<string, JsonPrimitive>, version: string): Buffer`**
- Logic:
  1. Wrap: `const envelope = { version, data: payload };`
  2. Serialize with a **deterministic stringify** — plain `JSON.stringify` does **not** guarantee key order, so this must use a canonical-JSON library (e.g. `json-stable-stringify` or `canonicalize` npm package) or a hand-rolled recursive key-sorter, producing output equivalent to Python's `sort_keys=True, separators=(",", ":")`: no whitespace, keys sorted lexicographically at every nesting level.
  3. Encode the resulting string to a UTF-8 `Buffer`.
  4. Return the buffer.
- Requirements:
  - Key order must never affect the digest — enforced by the canonical stringify step, not left to insertion order.
  - No whitespace in the serialized output — formatting must never affect the digest.
  - `payload` must contain only JSON-primitive values (`string`, `number`, `boolean`, `null`, nested object/array) — the function throws a `TypeError` early (via a recursive validator) if it encounters anything else (e.g., a `Date` object passed by mistake), because silently calling `.toString()` on a `Date` would break determinism across timezones/formats.
  - Numeric values that represent timestamps must already be normalized to an `integer` (Unix epoch seconds, `number` type, not `Date`) by the caller **before** calling this function — this module does not do timestamp parsing.
- Output: a `Buffer`, ready for hashing or salting-then-hashing.

### 7.2 `adapter/hasher.ts`

**Purpose:** Turns canonical bytes into the `0x`-prefixed hex digest the contract expects, with optional salting for low-entropy fields. Uses Node's built-in `crypto` module — no extra dependency needed for SHA-256.

**Function: `hashPayload(payload: Record<string, JsonPrimitive>, version: string, salt?: string): string`**
- Logic:
  1. `let raw = canonicalize(payload, version);`
  2. If `salt` is provided: `raw = Buffer.concat([Buffer.from(salt, "utf-8"), raw]);`
  3. `const digest = crypto.createHash("sha256").update(raw).digest("hex");`
  4. Return `"0x" + digest`.
- Salting policy (must be enforced by callers, documented here for reference): any payload whose entropy is dominated by a short/sequential identifier (a tourist's internal sequence number, a short trip code) **must** pass a per-record random salt (generated once at record-creation time and stored in PostgreSQL alongside the record — never on-chain, never derivable from the hash alone). Payloads that are already high-entropy (e.g., contain a UUID) do not strictly need salting but salting them anyway is harmless.
- **Function: `hashIdPayload(touristIdSeq: number, tripId: string, version: string, salt: string): string`** — a named convenience wrapper for the digital-ID case specifically, so call sites can't accidentally skip salting for the low-entropy `touristIdSeq` field. Internally builds `{ touristIdSeq, tripId }` and calls `hashPayload` with `salt` **required** (not optional) in this wrapper's own type signature.
- **Function: `hashEvidenceManifest(fileChecksumSha256: string, actorId: string, orgId: string, transferredAt: number, version: string): string`** — builds the evidence manifest object and hashes it (no salt needed — a file checksum is already high-entropy).
- **Function: `hashIncidentSnapshot(incidentId: string, state: string, transitionedAt: number, actorId: string, version: string): string`** — builds and hashes one incident-timeline state-transition snapshot.
- **Function: `hashConsentReceipt(tripId: string, consentVersion: string, orgId: string, role: string, windowStart: number, windowEnd: number, version: string): string`** — builds and hashes a consent/access receipt.

### 7.3 `adapter/types.ts`

**Purpose:** Shared TypeScript types/enums used across the adapter.

**Types to define:**
- `AnchorType` — union type: `"ID_ISSUE" | "ID_REVOKE" | "EVIDENCE" | "INCIDENT" | "CONSENT"`.
- `AnchorState` — union type: `"PENDING" | "CONFIRMED" | "FAILED"`.
- `AnchorJob` — interface: `{ jobId: string; anchorType: AnchorType; payloadHash: string; extraArgs: Record<string, unknown>; state: AnchorState; txHash: string | null; attempts: number; createdAt: number; lastError: string | null; }`.
- `VerificationResult` — interface mirroring the contract's `verifyId` return shape plus `chain: string` and `contractVersion: string`, matching the exact JSON example in §6/§13 of the source blueprint.
- `JsonPrimitive` — recursive type alias used by `canonicalize.ts`/`hasher.ts` to constrain payload shapes at compile time (`string | number | boolean | null | JsonPrimitive[] | { [key: string]: JsonPrimitive }`).

### 7.4 `adapter/chainClient.ts`

**Purpose:** The only module that actually talks to the chain. Everything else in the adapter goes through this module — no other file imports `ethers` directly.

**Class: `ChainClient`**
- **`constructor()`**: reads `CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, `ISSUER_PRIVATE_KEY`, `CHAIN_ID`, `CONTRACT_VERSION` from environment; loads the ABI (ideally the typechain-generated typed contract factory from §6) using the path recorded in `deployments/<network>.json`; constructs an `ethers.JsonRpcProvider` and `ethers.Wallet`, and a typed contract instance connected to that wallet.
- **`async issueId(idHash: string, tripHash: string, issuedAt: number, expiresAt: number, version: number): Promise<string>`**: builds and sends the `issueId` transaction; returns the transaction hash immediately **without awaiting confirmation** (the caller/job queue handles the wait asynchronously — Invariant 4). Throws a typed `ChainSubmissionError` on RPC failure at submission time (not on eventual revert — that's handled by `waitForReceipt`).
- **`async revokeId(idHash: string, reasonCode: number): Promise<string>`**: same pattern for `revokeId`.
- **`async anchorEvidence(evidenceHash: string, version: number): Promise<string>`**: same pattern for `anchorEvidence`.
- **`async anchorIncident(incidentHash: string, version: number): Promise<string>`**: same pattern for `anchorIncident`.
- **`async anchorConsent(consentHash: string, version: number): Promise<string>`**: same pattern for `anchorConsent`.
- **`async waitForReceipt(txHash: string, timeoutMs = 30000): Promise<{ status: "CONFIRMED" | "FAILED"; blockNumber: number | null; gasUsed: string | null }>`**: polls for the transaction receipt; a reverted transaction (`receipt.status === 0`) maps to `"FAILED"`, not a thrown error — failure is a normal, expected outcome the job queue must handle gracefully.
- **`async verifyId(idHash: string): Promise<VerificationResult>`**: calls the read-only `verifyId`; if the contract returns the zero-address issuer, maps to a `NOT_FOUND`-shaped result rather than throwing; if `expiresAt < now`, overrides the returned status to `EXPIRED` even if the contract's raw storage still says `ACTIVE` (mirrors the lazy-expiry read pattern from §2).
- **`async verifyEvidence(evidenceHash: string): Promise<{ exists: boolean; anchoredAt: number }>`** / **`verifyIncident`** / **`verifyConsent`**: thin wrappers over the corresponding view functions.
- **Error handling:** every method distinguishes three failure classes explicitly, because the job queue (§7.5) branches on them differently:
  1. **Submission failure** (RPC unreachable, nonce error, insufficient funds) → throw immediately, job queue marks `FAILED` and schedules a retry with backoff.
  2. **Timeout waiting for receipt** (node slow/down mid-wait) → the job stays `PENDING`, retried on next poll — this is the "chain outage" resilience case from the source blueprint's §12/§07A.
  3. **On-chain revert** (e.g., `ID_ALREADY_ISSUED`) → treated as **idempotent success**, not failure, for the anchor functions specifically, because `anchorEvidence`/`anchorIncident`/`anchorConsent` never revert on duplicates by design (§2) — a revert here means a genuine bug or a duplicate `issueId` call, which the job queue logs and marks `FAILED` with the revert reason captured.

### 7.5 `adapter/jobQueue.ts`

**Purpose:** Implements Invariant 4 and Invariant 5 concretely — an async, retry-safe, non-blocking queue between "the backend decided something needs anchoring" and "the chain has confirmed it." This is the module the Express route handlers actually call — they call `enqueue*` and return immediately; they never call `ChainClient` directly.

**Design:** A simple durable queue backed by a PostgreSQL table (`blockchain_anchor_jobs`, schema owned by the backend's Prisma migrations — this module only reads/writes it via Prisma Client, doesn't own the schema) plus a worker loop running on a `setInterval` inside the same Node process (or a separate `node worker.js` process sharing this package, if the team prefers isolating it — either is fine since it's all one language/runtime now). No Redis/BullMQ dependency required for the MVP scale (single-digit jobs/minute during a demo); the design leaves room to swap in a real queue later without changing the public function signatures.

**Public functions (the backend calls only these):**
- **`async enqueueIssueId(idHash, tripHash, issuedAt, expiresAt, version): Promise<string>`** (returns `jobId`): validates inputs, inserts a `PENDING` row via Prisma, returns immediately. Does **not** call the chain.
- **`async enqueueRevokeId(idHash, reasonCode): Promise<string>`**: same pattern.
- **`async enqueueAnchorEvidence(evidenceHash, version): Promise<string>`**: same pattern.
- **`async enqueueAnchorIncident(incidentHash, version): Promise<string>`**: same pattern.
- **`async enqueueAnchorConsent(consentHash, version): Promise<string>`**: same pattern.
- **`async getJobStatus(jobId: string): Promise<AnchorJob>`**: read-only lookup — this is what the backend's `GET /digital-ids/:id` (or similar) endpoint calls to show the tourist/dispatcher whether an anchor is `PENDING`/`CONFIRMED`/`FAILED`, per the source blueprint's explicit requirement that pending status is "shown... never hidden."

**Worker loop — `async runWorkerOnce(): Promise<WorkerRunSummary>`** (called on a timer, e.g. every 5 seconds, via `setInterval` at process startup):
1. Select all rows where `state === "PENDING"` and (`txHash IS NULL` OR the tx has been pending longer than a receipt-wait timeout).
2. For each: if `txHash` is null, submit via the matching `ChainClient` method; on submission success, store the returned `txHash` and increment `attempts`; on submission failure, increment `attempts`, store `lastError`, and if `attempts` exceeds a max (e.g. 5) mark `FAILED` and stop retrying automatically (surfaced for manual re-submission, per the source blueprint's failure table).
3. For rows that already have a `txHash`, call `waitForReceipt` with a short timeout; on `CONFIRMED`/`FAILED`, update the row's state accordingly.
4. **Idempotency guard before every submission:** for `EVIDENCE`/`INCIDENT`/`CONSENT` jobs, call the corresponding `verify*` read first — if it already shows `exists === true` on-chain (e.g., a prior run got the tx confirmed but the local job row didn't get updated due to a crash), mark the job `CONFIRMED` **without submitting a new transaction**. This directly implements "resubmitting a job for an already-anchored hash is a no-op."
5. Return a summary (counts of submitted/confirmed/failed) for logging/observability — never throws; a single job's failure must not crash the loop or affect other jobs (wrap each job's processing in its own try/catch).

### 7.6 `adapter/privacyScan.ts`

**Purpose:** Automates the "on-chain inspection checklist" from §9 of the source blueprint — a script/module the team runs before every demo (and ideally in CI) to mechanically confirm no PII/GPS ever reached the chain.

**Function: `async scanRecentEvents(chainClient: ChainClient, sinceBlock = 0): Promise<PrivacyScanReport>`**
- Logic:
  1. Fetch all emitted events (`IdIssued`, `IdRevoked`, `EvidenceAnchored`, `IncidentAnchored`, `ConsentAnchored`) from `sinceBlock` to latest via `contract.queryFilter`.
  2. For every event's every field, assert the field type — read from the contract's ABI/typechain types — is one of: `bytes32` (a hash), `address`, `uint64`/`uint8` (timestamps/codes/versions). Assert **no field is of type `string` or `bytes` (variable-length)** — this is checked against the ABI itself, not just the decoded values, so it also catches a future accidental contract change that adds a string field.
  3. Additionally, heuristically re-check decoded `bytes32` values: confirm they are NOT plausibly a raw coordinate pair or short ASCII string accidentally hashed-looking (best-effort sanity check, not a substitute for step 2's structural guarantee).
  4. Produce a `PrivacyScanReport` with `passed: boolean` and a per-check breakdown matching the exact five bullet points in the source blueprint's on-chain inspection checklist (§9/§15):
     - No name/phone/contact field in any anchored payload
     - No raw GPS coordinate in any anchored payload
     - No evidence file bytes on-chain (checksum only)
     - Every anchor carries a `version`
     - Revocation reason text is off-chain; only `reasonCode` is anchored
- Output: printed as a pass/fail checklist to stdout (for the pre-demo manual run, `npx ts-node adapter/privacyScan.ts` or a small CLI wrapper) and also returned as a structured object (for an optional CI assertion / Jest test).

### 7.7 `adapter/index.ts`
- Barrel file exposing the package's public surface: `canonicalize`, `hashPayload` and its named wrappers, `ChainClient`, the `enqueue*` functions, `getJobStatus`, `scanRecentEvents`, and the shared types from `types.ts`. Internal helper functions not meant for external use are not re-exported here.

---

## 8. `test/` — Hardhat/Solidity test files (TypeScript via Hardhat's `ts-node` support)

### `test/issueRevoke.test.ts`
- Deploys a fresh contract per test (Hardhat fixture, `loadFixture`).
- Asserts: `issueId` from an authorized issuer succeeds and emits `IdIssued` with exact expected args.
- Asserts: `issueId` from a non-authorized address reverts with `"NOT_AUTHORIZED_ISSUER"`.
- Asserts: `issueId` with `expiresAt <= issuedAt` reverts with `"INVALID_WINDOW"`.
- Asserts: calling `issueId` twice with the same `idHash` reverts with `"ID_ALREADY_ISSUED"`.
- Asserts: `verifyId` on an unissued hash returns the zero-address/default tuple.
- Asserts: `verifyId` on an active ID returns `ACTIVE` with correct issuer/window.
- Asserts: `revokeId` on an active ID succeeds, emits `IdRevoked` with the given `reasonCode`, and a subsequent `verifyId` returns `REVOKED`.
- Asserts: `revokeId` twice reverts with `"ID_NOT_ACTIVE"`.
- Asserts: `revokeId` on a non-existent `idHash` reverts with `"ID_NOT_FOUND"`.
- Asserts: after time-travel (Hardhat Network Helpers `time.increase`) past `expiresAt`, `verifyId` returns `EXPIRED` even though the ID was never explicitly revoked.

### `test/evidenceAnchor.test.ts`
- Asserts: `anchorEvidence` from an authorized issuer succeeds, emits `EvidenceAnchored`, and `verifyEvidence` subsequently returns `exists === true` with a non-zero timestamp.
- Asserts: calling `anchorEvidence` twice with the same hash does **not** revert and does **not** re-emit a second event with a different timestamp (idempotency — Invariant 5) — checked by asserting the second call's transaction emits zero `EvidenceAnchored` events.
- Asserts: unauthorized caller reverts.
- Mirrors the same three assertions for `anchorIncident`/`verifyIncident` and `anchorConsent`/`verifyConsent`.

### `test/incidentAnchor.test.ts`
- Contract-level state-machine test mirroring the incident timeline story from the source blueprint: anchor a `CREATED` snapshot hash, then an `ASSIGNED` snapshot hash, then a `RESOLVED` snapshot hash (three separate `incidentHash` values, since each snapshot is a different canonical payload) — asserts all three anchor independently and all three are independently verifiable, demonstrating "tampering after close" would require altering a *specific* anchored snapshot without ability to do so.

### `test/accessControl.test.ts`
- Asserts `authorizeIssuer`/`revokeIssuer` only callable by `admin`.
- Asserts a newly authorized issuer can call `issueId`; asserts a revoked issuer can no longer call any state-changing function (reverts `"NOT_AUTHORIZED_ISSUER"`).
- Asserts the deployer is auto-authorized at construction (per §2's constructor spec).

### `test/idempotency.test.ts`
- **Determinism regression test.** Takes a fixed sample payload, computes its hash via `adapter/hasher.ts`'s `hashPayload`, and asserts it equals a hardcoded expected digest committed as a fixture (`test/fixtures/canonicalHashes.json`) — this guards against a future refactor of `canonicalize.ts` (e.g., swapping the canonical-JSON library) silently changing digests for existing anchored records, which would break every already-issued proof. Since the adapter and the contract-test suite are now the same language, this test can `import` `hashPayload` directly rather than needing a cross-language fixture comparison.
- Re-anchoring the same evidence hash through the full submit→wait→submit-again path (via `ChainClient` directly, or through `jobQueue`'s idempotency guard) produces only one `EvidenceAnchored` event total.

---

## 9. Backend Integration (in-process, single language)

Because the adapter is TypeScript, the Node/Express backend imports it exactly like any other internal module — no service boundary, no port to configure, no second deployment target:

```ts
import { enqueueAnchorEvidence, getJobStatus, hashEvidenceManifest } from "../../blockchain/adapter";
```

- **Route handlers** (e.g. `POST /incidents/:id/evidence`) compute the manifest hash via `hashEvidenceManifest(...)`, call `enqueueAnchorEvidence(hash, version)`, store the returned `jobId` alongside the `EvidenceFile`/`EvidenceHash` row, and respond to the client immediately — matching Invariant 4 exactly, with zero network hop to a separate adapter process.
- **The worker loop** (`runWorkerOnce`, §7.5) is started once at backend process boot, e.g. in the same `server.ts` that starts Express: `setInterval(() => jobQueue.runWorkerOnce(), 5000);`. If the team later wants the worker isolated from the request-serving process (e.g. to avoid the polling loop competing for event-loop time under load), it can be extracted into a second `node dist/worker.js` entry point that imports the same `adapter` package — no code changes to the adapter itself, only to which script boots it.
- **Status display**: any endpoint that needs to show anchor status (tourist app's ID screen, dispatcher's evidence view) calls `getJobStatus(jobId)` and returns `PENDING`/`CONFIRMED`/`FAILED` directly to the frontend, per the source blueprint's "never hidden" requirement.

This is strictly simpler than a cross-language design: one `package.json`, one `node_modules`, one test runner (Jest or Vitest can cover both `adapter/*.test.ts` unit tests and, separately, Hardhat's own `test/*.test.ts` contract tests — two test commands, one language).

---

## 10. `docs/on-chain-inspection-checklist.md`

### Purpose
The literal, human-readable checklist the team runs before every demo (source blueprint §9 requires this as "a documented checklist step"). Content is a direct markdown transcription of the checks `adapter/privacyScan.ts` automates, plus two manual-only steps that can't be automated:
- [ ] No name, phone, or contact field in any anchored payload *(automated)*
- [ ] No raw GPS coordinate in any anchored payload *(automated)*
- [ ] No evidence file bytes on-chain — checksum only *(automated — structural ABI check)*
- [ ] Every anchor carries a `version` *(automated)*
- [ ] Reason text for revocation is off-chain; only `reasonCode` is anchored *(automated — checked structurally, since `IdRevoked`'s ABI has no string field)*
- [ ] Manual: open `deployments/<network>.json`, confirm `contractAddress` matches what the demo UI displays *(manual)*
- [ ] Manual: have one team member not involved in blockchain work independently run `npx ts-node adapter/privacyScan.ts` and confirm `passed: true` *(manual, second-pair-of-eyes)*

---

## 11. `README.md` (inside `blockchain/`)

### Purpose
Onboarding doc for the rest of the team (and for Prateek's own future reference). Must cover, in order:
1. One-paragraph restatement of Invariant 1–7 (the "why" — so nobody on the team accidentally proposes putting a GPS point on-chain later).
2. Local setup: `npm install` in `blockchain/` (covers both Hardhat tooling and the adapter package — one install, since it's all one `package.json`).
3. Running a local chain: `npx hardhat node`.
4. Deploying: `npx hardhat run scripts/deploy.ts --network localhost`.
5. Running the demo seed: `npx ts-node scripts/seedDemo.ts`.
6. How the backend consumes the adapter: `import { ... } from "../../blockchain/adapter"` — no separate process to start.
7. Running tests: `npx hardhat test` (contract layer, `test/*.test.ts`) and `npx jest adapter` or `npx vitest adapter` (adapter unit tests, if kept separate from the Hardhat test run).
8. Running the privacy scan: `npx ts-node adapter/privacyScan.ts`.
9. The env var table from §6 (`CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, `ISSUER_PRIVATE_KEY`, `CHAIN_ID`, `CONTRACT_VERSION`).
10. A one-line pointer to the Judge Q&A table (source blueprint §13A / §18) so whoever demos can answer "why blockchain?" confidently.

---

## 12. Traceability — every source-blueprint requirement mapped to a file

| Source blueprint requirement | Implemented in |
|---|---|
| Hash canonical, versioned payloads | `adapter/canonicalize.ts` |
| Salt low-entropy identifiers | `adapter/hasher.ts` (`hashIdPayload`) |
| Queue blockchain work, never block SOS | `adapter/jobQueue.ts` |
| PENDING/CONFIRMED/FAILED states | `adapter/types.ts` (`AnchorState`), `adapter/jobQueue.ts` |
| Idempotent re-anchoring | `TrustAnchor.sol` (§2 anchor functions), `test/evidenceAnchor.test.ts`, `jobQueue.ts` step 4 |
| Backend-only signer, no tourist wallets | `adapter/chainClient.ts` (single `ISSUER_PRIVATE_KEY`), contract has no tourist-facing function |
| Local Hardhat primary, testnet optional | `config/hardhat.config.ts`, `scripts/deploy.ts` |
| `issueId`/`revokeId`/`verifyId` | `TrustAnchor.sol`, `scripts/issue.ts` / `revoke.ts` / `verify.ts` |
| `anchorEvidence`/`anchorIncident` | `TrustAnchor.sol`, `scripts/anchorEvidence.ts` / `anchorIncident.ts` |
| Consent receipts (same pattern) | `TrustAnchor.sol` (`anchorConsent`), `adapter/hasher.ts` (`hashConsentReceipt`) |
| Agency/key revocation registry | `TrustAnchor.sol` (`authorizeIssuer`/`revokeIssuer`) |
| Transaction hash/chain/version stored in Postgres | `adapter/jobQueue.ts` writes to `blockchain_anchor_jobs` table (schema owned by backend Prisma migration, out of scope of this blueprint but the contract is specified here) |
| Chain-outage resilience / demo drill | `adapter/chainClient.ts` error classes, `adapter/jobQueue.ts` retry logic |
| On-chain inspection checklist | `adapter/privacyScan.ts`, `docs/on-chain-inspection-checklist.md` |
| Deterministic demo proof | `scripts/seedDemo.ts` |
| Contract test coverage (issue/verify/revoke, idempotency, access control) | `test/*.test.ts` |
| Hash-determinism regression guard | `test/idempotency.test.ts` |
| In-process backend integration | §9 (no separate service — one language, one runtime) |

---

**Everything a contributor needs to start writing code is now specified above.** No file in `blockchain/` should be implemented with logic that isn't traceable to a section in this document; if a need arises that isn't covered here, this document should be updated first.
## Server integration

The Express backend no longer needs to import this TypeScript adapter directly. The supported cross-directory boundary is `gateway/server.ts`, authenticated with `GATEWAY_API_KEY`. The gateway owns `ethers`, the RPC connection, contract ABI calls, and issuer key. The Express backend owns retries and persistence in `BlockchainAnchorJob`.
