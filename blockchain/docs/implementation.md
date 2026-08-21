# `blockchain/` Folder — Full By-Code Implementation Blueprint
### SIH25002 — Smart Tourist Safety Monitoring & Incident Response System
### Single Source of Truth for the Blockchain Trust Layer

> This document is **not code**. It is the complete functional specification for every file that must exist inside the `blockchain/` folder (at the repo root, alongside `apps/`, `packages/`, `prisma/`). Anyone — human or AI — should be able to implement the actual code from this document alone, with no other reference needed. Every file below states: its purpose, its exact inputs/outputs, its internal logic step-by-step, its error conditions, and how it's tested.

---

## 0. Folder Layout (target state)

```
blockchain/
├── contracts/
│   └── TrustAnchor.sol
├── scripts/
│   ├── deploy.js
│   ├── issue.js
│   ├── revoke.js
│   ├── verify.js
│   ├── anchorEvidence.js
│   ├── anchorIncident.js
│   └── seedDemo.js
├── test/
│   ├── issueRevoke.test.js
│   ├── evidenceAnchor.test.js
│   ├── incidentAnchor.test.js
│   ├── accessControl.test.js
│   └── idempotency.test.js
├── adapter/                          (Python, imported by the backend AI/BC service — see §9 for language note)
│   ├── __init__.py
│   ├── canonicalize.py
│   ├── hasher.py
│   ├── chain_client.py
│   ├── job_queue.py
│   ├── models.py
│   └── privacy_scan.py
├── config/
│   ├── hardhat.config.js
│   └── .env.example
├── deployments/
│   └── <network>.json                (generated at deploy time — not hand-written)
├── docs/
│   └── on-chain-inspection-checklist.md
└── README.md
```

**Language note (§9 explains fully):** Prateek's stated preference is Python. Hardhat/Solidity tooling is JavaScript-native and non-negotiable (contracts, deploy scripts, contract-level tests must be `.js`/`.sol` — there is no practical Python substitute for Hardhat). Everything **above** the contract boundary — canonicalization, hashing, the backend-facing adapter, the job queue, the privacy scanner — is specified here to be implemented in **Python**, callable from the Node/Express backend as a small internal service or CLI (see §9 for the exact integration shape). This keeps 100% of Prateek's own code in Python while leaving only the unavoidable Solidity/Hardhat scaffolding in JS.

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
The single on-chain contract. Stores only hashes/timestamps/status for three anchor types: digital IDs, evidence files, and incident timelines. No PII, ever, at the Solidity level — enforced structurally by only accepting `bytes32` hash parameters, never strings or arbitrary bytes.

### Solidity version & tooling
- `pragma solidity ^0.8.19;`
- No external dependencies beyond OpenZeppelin `AccessControl` (optional convenience) — a hand-rolled `onlyAuthorizedIssuer` modifier is sufficient and keeps the surface minimal; OpenZeppelin is acceptable if the team wants a more auditable access-control pattern, but is not required.

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

## 3. `scripts/deploy.js`

### Purpose
Deploys `TrustAnchor.sol` to whichever network Hardhat is pointed at (local Hardhat node by default; testnet optional/secondary per Invariant 7) and writes deployment metadata to disk for the backend to consume.

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
- The deployment JSON file (consumed by `adapter/chain_client.py`, see §7).
- Non-zero exit code and a clear stderr message on any failure (RPC unreachable, insufficient funds, compile error).

---

## 4. `scripts/issue.js`, `scripts/revoke.js`, `scripts/verify.js`, `scripts/anchorEvidence.js`, `scripts/anchorIncident.js`

### Purpose
Thin, **standalone, demo-runnable** CLI scripts that each perform exactly one contract operation, for use in (a) the judge-facing demo drill, (b) manual smoke-testing without booting the whole backend, and (c) as the reference implementation the Python adapter's transaction-building logic mirrors.

Each script:
- Loads `deployments/<network>.json` to get the contract address + ABI path.
- Connects with `ethers.js` using `CHAIN_RPC_URL` + `ISSUER_PRIVATE_KEY`.
- Accepts its specific arguments via CLI flags (documented per-script below) so they're runnable in isolation: `node scripts/issue.js --idHash 0x... --tripHash 0x... --expiresInHours 168`.
- Prints a structured JSON result to stdout (`{ "txHash": "...", "status": "CONFIRMED", ... }`) so it can be piped/parsed by a shell demo runner.

**`issue.js`** — computes `issuedAt = now`, `expiresAt = now + expiresInHours`, calls `issueId`, waits for 1 confirmation, prints the emitted `IdIssued` event fields.

**`revoke.js`** — calls `revokeId(idHash, reasonCode)`, prints the emitted `IdRevoked` fields.

**`verify.js`** — calls the **view** function `verifyId(idHash)` (no gas, no wait), prints status/issuer/window in the exact JSON shape shown in §6 of the source blueprint (`idHash`, `status`, `issuer`, `issuedAt`, `expiresAt`, `chain`, `contractVersion`).

**`anchorEvidence.js`** / **`anchorIncident.js`** — accept the pre-computed hash (these scripts do **not** hash — hashing happens in the Python adapter, §7 — they only anchor a hash you already have), call the respective anchor function, print the emitted event and idempotency outcome (`"alreadyAnchored": true/false`).

---

## 5. `scripts/seedDemo.js`

### Purpose
One-command deterministic setup for the judge demo: deploys (if not already deployed), issues one fictional tourist ID, leaves it active, and prints every value needed to drive the 5-minute demo runbook (§13 of the source blueprint) — so the demo never depends on live typing.

### Logic
1. Run (or detect an existing) deployment.
2. Compute a deterministic `idHash`/`tripHash` from fixed demo seed data (fictional tourist, fixed trip ID) using the **same** canonicalize+hash logic as the Python adapter (the script calls into a tiny mirrored JS helper — see the note in §7 about keeping the two hash implementations byte-identical, with a cross-language test in `test/idempotency.test.js`).
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

## 6. `config/hardhat.config.js` and `config/.env.example`

### `hardhat.config.js`
- Declares two networks: `hardhat` (in-memory, default — instant blocks, no config needed) and `localhost` (persistent local node via `npx hardhat node`, used so the backend can stay connected across script runs during a live demo).
- Optionally declares a `testnet` network entry reading `CHAIN_RPC_URL`/`ISSUER_PRIVATE_KEY`/`CHAIN_ID` from env — commented out / clearly marked optional, consistent with Invariant 7.
- Solidity compiler version pinned to match the contract's pragma (`0.8.19`), optimizer enabled (low `runs` value is fine — this contract is tiny).

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

## 7. Python Adapter Package — `blockchain/adapter/`

This is the layer the Node/Express backend actually calls. It owns canonicalization, hashing, salting, transaction submission, async state tracking, retries, and the privacy self-check. Implemented as an installable Python package (or a small FastAPI microservice if the team prefers an HTTP boundary — see §9 for the integration decision) so **all of Prateek's own logic is Python**, with `ethers`-level chain calls happening either (a) by shelling out to the `scripts/*.js` CLI tools in §4, or (b) via a Python web3 library (`web3.py`) pointed at the same Hardhat RPC. **Recommended: `web3.py` directly** — it avoids a Node subprocess dependency entirely and keeps the whole adapter self-contained. Both options are documented in §9; the rest of this section is written against the `web3.py` approach since it's the recommended path.

### 7.1 `adapter/canonicalize.py`

**Purpose:** Deterministic, versioned JSON canonicalization — the single function every other module hashes through, so two callers of the same logical payload always produce byte-identical input to SHA-256.

**Function: `canonicalize(payload: dict, version: str) -> bytes`**
- Logic:
  1. Wrap: `envelope = {"version": version, "data": payload}`.
  2. Serialize with `json.dumps(envelope, sort_keys=True, separators=(",", ":"), ensure_ascii=True)`.
  3. Encode to UTF-8 bytes.
  4. Return the bytes.
- Requirements:
  - `sort_keys=True` is mandatory — field order must never affect the digest.
  - No whitespace (`separators` strips it) — formatting must never affect the digest.
  - `payload` must contain only JSON-primitive values (str, int, float, bool, None, nested dict/list) — the function raises `TypeError` early (via a recursive validator) if it encounters anything else (e.g., a `datetime` object passed by mistake), because silent `str()` coercion of a datetime would break determinism across timezones/formats.
  - Numeric values that represent timestamps must already be normalized to `int` (Unix epoch seconds) by the caller **before** calling this function — this module does not do timestamp parsing.
- Output: raw bytes, ready for hashing or salting-then-hashing.

### 7.2 `adapter/hasher.py`

**Purpose:** Turns canonical bytes into the `0x`-prefixed hex digest the contract expects, with optional salting for low-entropy fields.

**Function: `hash_payload(payload: dict, version: str, salt: str | None = None) -> str`**
- Logic:
  1. `raw = canonicalize(payload, version)`.
  2. If `salt` is provided: `raw = salt.encode("utf-8") + raw`.
  3. `digest = hashlib.sha256(raw).hexdigest()`.
  4. Return `"0x" + digest`.
- Salting policy (must be enforced by callers, documented here for reference): any payload whose entropy is dominated by a short/sequential identifier (a tourist's internal sequence number, a short trip code) **must** pass a per-record random salt (generated once at record-creation time and stored in PostgreSQL alongside the record — never on-chain, never derivable from the hash alone). Payloads that are already high-entropy (e.g., contain a UUID) do not strictly need salting but salting them anyway is harmless and the adapter defaults to "always salt if a salt is supplied by the caller."
- **Function: `hash_id_payload(tourist_id_seq: int, trip_id: str, version: str, salt: str) -> str`** — a named convenience wrapper for the digital-ID case specifically, so call sites can't accidentally skip salting for the low-entropy `tourist_id_seq` field. Internally builds `{"touristIdSeq": tourist_id_seq, "tripId": trip_id}` and calls `hash_payload` with the salt required (not optional) in this wrapper's signature.
- **Function: `hash_evidence_manifest(file_checksum_sha256: str, actor_id: str, org_id: str, transferred_at: int, version: str) -> str`** — builds the evidence manifest dict and hashes it (no salt needed — a file checksum is already high-entropy).
- **Function: `hash_incident_snapshot(incident_id: str, state: str, transitioned_at: int, actor_id: str, version: str) -> str`** — builds and hashes one incident-timeline state-transition snapshot.
- **Function: `hash_consent_receipt(trip_id: str, consent_version: str, org_id: str, role: str, window_start: int, window_end: int, version: str) -> str`** — builds and hashes a consent/access receipt.

### 7.3 `adapter/models.py`

**Purpose:** Typed data structures shared across the adapter (using Python `dataclasses` or `pydantic` — `pydantic` recommended since the backend likely already validates JSON this way elsewhere).

**Types to define:**
- `AnchorType` — enum: `ID_ISSUE`, `ID_REVOKE`, `EVIDENCE`, `INCIDENT`, `CONSENT`.
- `AnchorState` — enum: `PENDING`, `CONFIRMED`, `FAILED`.
- `AnchorJob` — fields: `job_id: str` (UUID), `anchor_type: AnchorType`, `payload_hash: str`, `extra_args: dict` (e.g., `tripHash`/`expiresAt` for issuance, `reasonCode` for revoke), `state: AnchorState`, `tx_hash: str | None`, `attempts: int`, `created_at: int`, `last_error: str | None`.
- `VerificationResult` — fields mirroring the contract's `verifyId` return shape plus `chain: str` and `contractVersion: str`, matching the exact JSON example in §6/§13 of the source blueprint.

### 7.4 `adapter/chain_client.py`

**Purpose:** The only module that actually talks to the chain. Everything else in the adapter goes through this module — no other file imports `web3` directly.

**Class: `ChainClient`**
- **`__init__(self)`**: reads `CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, `ISSUER_PRIVATE_KEY`, `CHAIN_ID`, `CONTRACT_VERSION` from environment; loads the ABI JSON from the path recorded in `deployments/<network>.json`; constructs a `web3.Web3` instance and a contract object; derives the issuer address from the private key.
- **`issue_id(id_hash: str, trip_hash: str, issued_at: int, expires_at: int, version: int) -> str`**: builds, signs, and sends the `issueId` transaction; returns the transaction hash immediately **without waiting for confirmation** (the caller/job queue handles the wait asynchronously — Invariant 4). Raises a typed `ChainSubmissionError` on RPC failure at submission time (not on eventual revert — that's handled by `wait_for_receipt`).
- **`revoke_id(id_hash: str, reason_code: int) -> str`**: same pattern for `revokeId`.
- **`anchor_evidence(evidence_hash: str, version: int) -> str`**: same pattern for `anchorEvidence`.
- **`anchor_incident(incident_hash: str, version: int) -> str`**: same pattern for `anchorIncident`.
- **`anchor_consent(consent_hash: str, version: int) -> str`**: same pattern for `anchorConsent`.
- **`wait_for_receipt(tx_hash: str, timeout_seconds: int = 30) -> dict`**: polls for the transaction receipt; returns `{"status": "CONFIRMED" | "FAILED", "blockNumber": int | None, "gasUsed": int | None}`. A reverted transaction (`receipt.status == 0`) maps to `"FAILED"`, not an exception — failure is a normal, expected outcome the job queue must handle gracefully.
- **`verify_id(id_hash: str) -> VerificationResult`**: calls the read-only `verifyId`; if the contract returns the zero-address issuer, maps to a `NOT_FOUND`-shaped result rather than raising; if `expiresAt < now`, overrides the returned status to `EXPIRED` even if the contract's raw storage still says `ACTIVE` (mirrors the lazy-expiry read pattern from §2).
- **`verify_evidence(evidence_hash: str) -> dict`** / **`verify_incident(incident_hash: str) -> dict`** / **`verify_consent(consent_hash: str) -> bool`**: thin wrappers over the corresponding view functions.
- **Error handling:** every method distinguishes three failure classes explicitly, because the job queue (§7.5) branches on them differently:
  1. **Submission failure** (RPC unreachable, nonce error, insufficient funds) → raise immediately, job queue marks `FAILED` and schedules a retry with backoff.
  2. **Timeout waiting for receipt** (node slow/down mid-wait) → the job stays `PENDING`, retried on next poll — this is the "chain outage" resilience case from the source blueprint's §12/§07A.
  3. **On-chain revert** (e.g., `ID_ALREADY_ISSUED`) → this is treated as **idempotent success**, not failure, for the anchor functions specifically, because the contract's `anchorEvidence`/`anchorIncident`/`anchorConsent` never revert on duplicates by design (§2) — a revert here means a genuine bug or a duplicate `issueId` call, which the job queue logs and marks `FAILED` with the revert reason captured.

### 7.5 `adapter/job_queue.py`

**Purpose:** Implements Invariant 4 and Invariant 5 concretely — an async, retry-safe, non-blocking queue between "the backend decided something needs anchoring" and "the chain has confirmed it." This is the module the Express backend's request handlers actually call — they call `enqueue_*` and return immediately; they never call `chain_client` directly.

**Design:** A simple durable queue backed by a PostgreSQL table (`blockchain_anchor_jobs`, schema owned by the backend's Prisma migrations — this module only reads/writes it, doesn't own the schema) plus an in-process or cron-triggered worker loop. No Redis/Celery dependency required for the MVP scale (single-digit jobs/minute during a demo); the design leaves room to swap in a real queue later without changing the public function signatures.

**Public functions (the backend calls only these):**
- **`enqueue_issue_id(id_hash, trip_hash, issued_at, expires_at, version) -> str`** (returns `job_id`): validates inputs, inserts a `PENDING` row, returns immediately. Does **not** call the chain.
- **`enqueue_revoke_id(id_hash, reason_code) -> str`**: same pattern.
- **`enqueue_anchor_evidence(evidence_hash, version) -> str`**: same pattern.
- **`enqueue_anchor_incident(incident_hash, version) -> str`**: same pattern.
- **`enqueue_anchor_consent(consent_hash, version) -> str`**: same pattern.
- **`get_job_status(job_id) -> AnchorJob`**: read-only lookup — this is what the backend's `GET /digital-ids/:id` (or similar) endpoint calls to show the tourist/dispatcher whether an anchor is `PENDING`/`CONFIRMED`/`FAILED`, per the source blueprint's explicit requirement that pending status is "shown... never hidden."

**Worker loop — `run_worker_once() -> WorkerRunSummary`** (called on a timer, e.g. every 5 seconds, by whatever process runner the backend uses):
1. Select all rows where `state == PENDING` and (`tx_hash IS NULL` OR the tx has been pending longer than a receipt-wait timeout).
2. For each: if `tx_hash IS NULL`, submit via the matching `chain_client` method; on submission success, store the returned `tx_hash` and increment `attempts`; on submission failure, increment `attempts`, store `last_error`, and if `attempts` exceeds a max (e.g. 5) mark `FAILED` and stop retrying automatically (surfaced for manual re-submission, per the source blueprint's failure table).
3. For rows that already have a `tx_hash`, call `wait_for_receipt` with a short timeout; on `CONFIRMED`/`FAILED`, update the row's state accordingly.
4. **Idempotency guard before every submission:** for `anchor_evidence`/`anchor_incident`/`anchor_consent` jobs, call the corresponding `verify_*` read first — if it already shows `exists == true` on-chain (e.g., a prior run got the tx confirmed but the local job row didn't get updated due to a crash), mark the job `CONFIRMED` **without submitting a new transaction**. This directly implements "resubmitting a job for an already-anchored hash is a no-op."
5. Return a summary (counts of submitted/confirmed/failed) for logging/observability — never raises; a single job's failure must not crash the loop or affect other jobs.

### 7.6 `adapter/privacy_scan.py`

**Purpose:** Automates the "on-chain inspection checklist" from §9 of the source blueprint — a script/module the team runs before every demo (and ideally in CI) to mechanically confirm no PII/GPS ever reached the chain.

**Function: `scan_recent_events(chain_client: ChainClient, since_block: int = 0) -> PrivacyScanReport`**
- Logic:
  1. Fetch all emitted events (`IdIssued`, `IdRevoked`, `EvidenceAnchored`, `IncidentAnchored`, `ConsentAnchored`) from `since_block` to latest.
  2. For every event's every field, assert the field type is one of: `bytes32` (a hash), `address`, `uint64`/`uint8` (timestamps/codes/versions). Assert **no field is of type `string` or `bytes` (variable-length)** — this is checked against the ABI itself, not just the decoded values, so it also catches a future accidental contract change that adds a string field.
  3. Additionally, heuristically re-check decoded `bytes32` values: confirm they are NOT plausibly a raw coordinate pair or short ASCII string accidentally hashed-looking (best-effort sanity check, not a substitute for step 2's structural guarantee).
  4. Produce a `PrivacyScanReport` with `passed: bool` and a per-check breakdown matching the exact five bullet points in the source blueprint's on-chain inspection checklist (§9/§15):
     - No name/phone/contact field in any anchored payload
     - No raw GPS coordinate in any anchored payload
     - No evidence file bytes on-chain (checksum only)
     - Every anchor carries a `version`
     - Revocation reason text is off-chain; only `reasonCode` is anchored
- Output: printed as a pass/fail checklist to stdout (for the pre-demo manual run) and also returned as a structured object (for an optional CI assertion).

### 7.7 `adapter/__init__.py`
- Exposes the package's public surface: `canonicalize`, `hash_payload` and its named wrappers, `ChainClient`, the `enqueue_*` functions, `get_job_status`, and `scan_recent_events`. Internal modules (`models`) are not re-exported beyond the types callers need (`AnchorJob`, `AnchorState`, `VerificationResult`).

---

## 8. `test/` — Hardhat/Solidity test files (JavaScript, per §9)

### `test/issueRevoke.test.js`
- Deploys a fresh contract per test (Hardhat fixture).
- Asserts: `issueId` from an authorized issuer succeeds and emits `IdIssued` with exact expected args.
- Asserts: `issueId` from a non-authorized address reverts with `"NOT_AUTHORIZED_ISSUER"`.
- Asserts: `issueId` with `expiresAt <= issuedAt` reverts with `"INVALID_WINDOW"`.
- Asserts: calling `issueId` twice with the same `idHash` reverts with `"ID_ALREADY_ISSUED"`.
- Asserts: `verifyId` on an unissued hash returns the zero-address/default tuple.
- Asserts: `verifyId` on an active ID returns `ACTIVE` with correct issuer/window.
- Asserts: `revokeId` on an active ID succeeds, emits `IdRevoked` with the given `reasonCode`, and a subsequent `verifyId` returns `REVOKED`.
- Asserts: `revokeId` twice reverts with `"ID_NOT_ACTIVE"`.
- Asserts: `revokeId` on a non-existent `idHash` reverts with `"ID_NOT_FOUND"`.
- Asserts: after time-travel (Hardhat `evm_increaseTime`) past `expiresAt`, `verifyId` returns `EXPIRED` even though the ID was never explicitly revoked.

### `test/evidenceAnchor.test.js`
- Asserts: `anchorEvidence` from an authorized issuer succeeds, emits `EvidenceAnchored`, and `verifyEvidence` subsequently returns `exists == true` with a non-zero timestamp.
- Asserts: calling `anchorEvidence` twice with the same hash does **not** revert and does **not** re-emit a second event with a different timestamp (idempotency — Invariant 5) — checked by asserting the second call's transaction emits zero `EvidenceAnchored` events.
- Asserts: unauthorized caller reverts.
- Mirrors the same three assertions for `anchorIncident`/`verifyIncident` and `anchorConsent`/`verifyConsent`.

### `test/incidentAnchor.test.js`
- Contract-level state-machine test mirroring the incident timeline story from the source blueprint: anchor a `CREATED` snapshot hash, then an `ASSIGNED` snapshot hash, then a `RESOLVED` snapshot hash (three separate `incidentHash` values, since each snapshot is a different canonical payload) — asserts all three anchor independently and all three are independently verifiable, demonstrating "tampering after close" would require altering a *specific* anchored snapshot without ability to do so.

### `test/accessControl.test.js`
- Asserts `authorizeIssuer`/`revokeIssuer` only callable by `admin`.
- Asserts a newly authorized issuer can call `issueId`; asserts a revoked issuer can no longer call any state-changing function (reverts `"NOT_AUTHORIZED_ISSUER"`).
- Asserts the deployer is auto-authorized at construction (per §2's constructor spec).

### `test/idempotency.test.js`
- **Cross-language determinism test.** Takes a fixed sample payload, computes its hash two ways: (a) via the JS reference `canonicalize`/hash helper mirrored in `scripts/seedDemo.js`, and (b) via a fixture file of expected outputs generated once by running the Python `adapter/hasher.py` against the same fixed input and committing the expected hex digest as a test fixture (`test/fixtures/canonical_hashes.json`). Asserts both equal the same expected digest. This is the guard against the two implementations (JS demo scripts vs. Python adapter) silently drifting apart, which would otherwise be a subtle, hard-to-detect bug (a hash computed by the backend wouldn't match one computed by a demo script, even though both are "correct" in isolation).
- Re-anchoring the same evidence hash through the full submit→wait→submit-again path produces only one `EvidenceAnchored` event total.

---

## 9. Language Boundary & Backend Integration (binding decision, not optional)

**Why not pure Python:** Hardhat, the Solidity compiler toolchain, ethers.js-based deploy/test ergonomics, and the project's own stated stack (`Solidity + Hardhat + ethers.js`, per the source blueprint's approved technology table) are JavaScript-first tooling with no equivalent-maturity Python alternative for this scope. Fighting that would cost more time than it saves during a hackathon.

**Why the adapter is still Python:** Everything that is *not* Hardhat-specific (canonicalization, hashing, salting, job queueing, privacy scanning) is ordinary application logic with no dependency on Hardhat's JS runtime. `web3.py` talks to the exact same JSON-RPC endpoint Hardhat exposes (`http://127.0.0.1:8545`), so a Python process can submit transactions to the Hardhat node exactly as ethers.js would — there is no functional loss.

**Integration shape (pick one, document the choice in `README.md` §12):**
- **Option A (recommended): the Python adapter runs as a small internal FastAPI service** (`adapter_service.py`, exposing `POST /internal/anchors/evidence`, `GET /internal/anchors/:jobId`, etc.), and the Node/Express backend calls it over HTTP exactly the way it already calls the AI service — this matches the project's existing pattern of "Node core + Python microservice for non-JS-native work" (the AI service is already specified this way in the source blueprint's §04A), so there's zero new architectural concept for the team to learn.
- **Option B: the Node backend shells out to Python as short-lived CLI invocations** for each operation. Simpler to wire up with no new running process, but worse for the async job-queue worker loop (§7.5), which wants to run continuously, not be re-invoked as a subprocess every 5 seconds. Not recommended for that reason.

**This blueprint assumes Option A.** `adapter_service.py` (one additional file, living at `blockchain/adapter/adapter_service.py`) is a thin FastAPI wrapper: each endpoint validates the request body, calls the corresponding `job_queue.enqueue_*` function, and returns `{"jobId": "..."}` immediately (HTTP 202-style semantics even if actually returning 200) — never waits on-chain inline. A background task (FastAPI `BackgroundTasks` or a simple `asyncio` loop started at service startup) calls `job_queue.run_worker_once()` on a fixed interval.

---

## 10. `docs/on-chain-inspection-checklist.md`

### Purpose
The literal, human-readable checklist the team runs before every demo (source blueprint §9 requires this as "a documented checklist step"). Content is a direct markdown transcription of the checks `adapter/privacy_scan.py` automates, plus two manual-only steps that can't be automated:
- [ ] No name, phone, or contact field in any anchored payload *(automated)*
- [ ] No raw GPS coordinate in any anchored payload *(automated)*
- [ ] No evidence file bytes on-chain — checksum only *(automated — structural ABI check)*
- [ ] Every anchor carries a `version` *(automated)*
- [ ] Reason text for revocation is off-chain; only `reasonCode` is anchored *(automated — checked structurally, since `IdRevoked`'s ABI has no string field)*
- [ ] Manual: open `deployments/<network>.json`, confirm `contractAddress` matches what the demo UI displays *(manual)*
- [ ] Manual: have one team member not involved in blockchain work independently run `python -m adapter.privacy_scan` and confirm `passed: true` *(manual, second-pair-of-eyes)*

---

## 11. `README.md` (inside `blockchain/`)

### Purpose
Onboarding doc for the rest of the team (and for Prateek's own future reference). Must cover, in order:
1. One-paragraph restatement of Invariant 1–7 (the "why" — so nobody on the team accidentally proposes putting a GPS point on-chain later).
2. Local setup: `npm install` in `blockchain/` for Hardhat tooling; `pip install -e .` (or `poetry install`) for the `adapter/` package.
3. Running a local chain: `npx hardhat node`.
4. Deploying: `npx hardhat run scripts/deploy.js --network localhost`.
5. Running the demo seed: `node scripts/seedDemo.js`.
6. Starting the adapter service: `uvicorn adapter.adapter_service:app --port 8090` (or whatever port is chosen — must match what the Node backend's `.env` points at).
7. Running tests: `npx hardhat test` (contract layer) and `pytest blockchain/adapter` (Python layer).
8. Running the privacy scan: `python -m adapter.privacy_scan`.
9. The env var table from §10 of the source blueprint (`CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, `ISSUER_PRIVATE_KEY`, `CHAIN_ID`), plus the adapter-specific `CONTRACT_VERSION` and the adapter service's own port/URL for the backend to call.
10. A one-line pointer to the Judge Q&A table (source blueprint §13A / §18) so whoever demos can answer "why blockchain?" confidently.

---

## 12. Traceability — every source-blueprint requirement mapped to a file

| Source blueprint requirement | Implemented in |
|---|---|
| Hash canonical, versioned payloads | `adapter/canonicalize.py` |
| Salt low-entropy identifiers | `adapter/hasher.py` (`hash_id_payload`) |
| Queue blockchain work, never block SOS | `adapter/job_queue.py` |
| PENDING/CONFIRMED/FAILED states | `adapter/models.py` (`AnchorState`), `adapter/job_queue.py` |
| Idempotent re-anchoring | `TrustAnchor.sol` (§2 anchor functions), `test/evidenceAnchor.test.js`, `job_queue.py` step 4 |
| Backend-only signer, no tourist wallets | `adapter/chain_client.py` (single `ISSUER_PRIVATE_KEY`), contract has no tourist-facing function |
| Local Hardhat primary, testnet optional | `config/hardhat.config.js`, `scripts/deploy.js` |
| `issueId`/`revokeId`/`verifyId` | `TrustAnchor.sol`, `scripts/issue.js` / `revoke.js` / `verify.js` |
| `anchorEvidence`/`anchorIncident` | `TrustAnchor.sol`, `scripts/anchorEvidence.js` / `anchorIncident.js` |
| Consent receipts (same pattern) | `TrustAnchor.sol` (`anchorConsent`), `adapter/hasher.py` (`hash_consent_receipt`) |
| Agency/key revocation registry | `TrustAnchor.sol` (`authorizeIssuer`/`revokeIssuer`) |
| Transaction hash/chain/version stored in Postgres | `adapter/job_queue.py` writes to `blockchain_anchor_jobs` table (schema owned by backend Prisma migration, out of scope of this blueprint but the contract is specified here) |
| Chain-outage resilience / demo drill | `adapter/chain_client.py` error classes, `adapter/job_queue.py` retry logic |
| On-chain inspection checklist | `adapter/privacy_scan.py`, `docs/on-chain-inspection-checklist.md` |
| Deterministic demo proof | `scripts/seedDemo.js` |
| Contract test coverage (issue/verify/revoke, idempotency, access control) | `test/*.test.js` |
| Cross-language hash consistency | `test/idempotency.test.js` |

---

**Everything a contributor needs to start writing code is now specified above.** No file in `blockchain/` should be implemented with logic that isn't traceable to a section in this document; if a need arises that isn't covered here, this document should be updated first.