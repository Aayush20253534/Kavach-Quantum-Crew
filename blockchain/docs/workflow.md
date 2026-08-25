# Blockchain Workflow

This document explains **where blockchain is used in KAVACH, why it is used, what data reaches the chain, and how a request moves from the JavaScript backend to the smart contract and back**.

It describes the code that exists in this repository. The smart contract also contains evidence and incident anchoring functions, but the current Express integration actively uses blockchain for **trip credential issuance, extension, revocation, and verification**. Evidence and incident anchoring remain contract-level capabilities until the backend wires those flows into the same gateway/queue pattern.

## 1. Why blockchain exists in this project

The ordinary application database is still the main source of application data. PostgreSQL stores users, trips, groups, credentials, incidents, evidence metadata, notifications, and operational state.

Blockchain is used as a **trust anchor**, not as a replacement database.

A trust anchor is a small piece of tamper-resistant information that another party can independently check later. In KAVACH, the backend hashes a credential identity and writes that hash to the `TrustAnchor` smart contract. The contract records whether that hash is active, revoked, or expired, together with issuance metadata.

That gives the system two layers:

1. **Off-chain application layer**: fast, private, editable data in PostgreSQL.
2. **On-chain trust layer**: privacy-safe hashes and status records that are difficult to alter secretly after confirmation.

No tourist needs a crypto wallet and no tourist sends a blockchain transaction. The backend owns the integration.

## 2. Where blockchain is currently used

### Live backend integration

Blockchain is currently wired into the QR trip credential lifecycle:

- individual trip credential creation
- group trip credential creation
- credential expiry extension when a trip is extended
- credential revocation when a trip or individual credential is revoked
- QR credential verification against the smart contract after the local credential has been confirmed on-chain

Relevant backend files:

```text
server/src/modules/credential/
server/src/integrations/blockchain/blockchain.service.js
server/src/integrations/blockchain/blockchain.queue.js
server/src/jobs/blockchainAnchor.job.js
```

Relevant blockchain files:

```text
blockchain/contracts/TrustAnchor.sol
blockchain/gateway/server.ts
```

### Contract capabilities not yet fully wired into Express

`TrustAnchor.sol` also supports anchoring:

- evidence hashes
- incident hashes

Those capabilities are useful for future chain-of-custody and incident-integrity workflows. The contract and scripts exist, but a reader should not assume every evidence or incident created by the backend is automatically anchored today.

## 3. The important terms

### Blockchain

A replicated ledger where transactions are grouped into blocks and accepted by a network. Once a transaction is confirmed, changing its historical result is intentionally difficult.

### Smart contract

A program deployed to a blockchain. `TrustAnchor.sol` is the KAVACH smart contract. It contains the rules for issuing, extending, revoking, and verifying credential hashes.

### Hash

A fixed-length fingerprint calculated from input data. KAVACH uses SHA-256 in the Express backend to create 32-byte values suitable for the contract.

A hash is one-way for practical purposes. The contract does not need to know the tourist's name, email, QR token, or database row contents.

### `bytes32`

A Solidity type containing exactly 32 bytes. SHA-256 produces 32 bytes, so credential and trip hashes fit naturally into `bytes32`.

### Transaction

A blockchain operation that changes state. `issueId`, `extendId`, and `revokeId` are transactions and require the issuer wallet to pay gas.

### Read call

A blockchain operation that reads state without changing it. `verifyId` is a read call and does not create a new transaction.

### Gas

The network fee paid for executing a state-changing transaction. The configured issuer wallet must have enough native testnet currency to pay gas.

### RPC endpoint

A network URL used by software to communicate with a blockchain node. The gateway connects to `CHAIN_RPC_URL` through ethers.js.

### Chain ID

A numeric identifier for a blockchain network. Sepolia uses chain ID `11155111`. Checking the chain ID prevents accidentally talking to the wrong network.

### Contract address

The address where `TrustAnchor` is deployed. The gateway checks that bytecode actually exists at this address before declaring itself healthy.

### Issuer wallet

The blockchain account whose private key is configured in the gateway. It signs transactions. The private key must never be exposed to the frontend or general API process.

### Transaction hash

A unique identifier for a submitted blockchain transaction. KAVACH stores it as `chainTxHash` after confirmation so operators can trace the write on a block explorer.

### Idempotency

The property that safely repeating the same operation does not create a different final result. The gateway treats some repeated issue/extend/revoke requests as success when the chain already contains the desired state.

## 4. Components and responsibilities

```text
Frontend
   |
   | HTTP API / QR verification
   v
Express backend
   |
   | creates credential + SHA-256 hash
   | writes DB job
   v
PostgreSQL BlockchainAnchorJob queue
   |
   | polled by blockchainAnchorJob
   v
blockchain.service.js
   |
   | HTTP + x-kavach-chain-key
   v
Blockchain gateway
   |
   | ethers.js + issuer private key
   v
RPC provider
   |
   v
TrustAnchor smart contract
```

### Frontend

The frontend displays QR credentials and verification results. It does not receive the issuer private key and does not submit blockchain transactions.

### Express backend

The backend decides when a credential should exist or change. It creates privacy-safe hashes, stores local credential state, queues chain work, and verifies confirmed credentials through the gateway.

### PostgreSQL queue

`BlockchainAnchorJob` is a database-backed asynchronous queue. It decouples normal API requests from slower or temporarily unavailable blockchain transactions.

### Worker

`blockchainAnchor.job.js` periodically processes pending jobs. It starts when the server starts and blockchain support is enabled.

### Gateway

`blockchain/gateway/server.ts` isolates chain-specific code and secrets. It accepts authenticated HTTP requests from the backend, validates the inputs, calls the smart contract, waits for confirmation, and returns a transaction hash.

### Smart contract

`TrustAnchor.sol` is the durable on-chain state machine. It stores credential/status hashes and metadata plus append-only encrypted identity/group snapshot ciphertext; it never stores plaintext tourist identity/contact data.

## 5. What is stored on-chain and what stays off-chain

### On-chain

For a digital credential, the contract stores or derives access to:

- `idHash`
- `tripHash`
- issue timestamp
- expiry timestamp
- status
- issuer address
- contract/data version

For the contract's additional anchoring capabilities it can also store evidence and incident hashes plus anchoring timestamps.

### Off-chain

The following remain in the application/backend systems:

- plaintext tourist names
- plaintext email addresses
- plaintext phone numbers
- JWTs
- QR token contents
- raw trip IDs
- GPS coordinates
- group membership records
- incident descriptions
- evidence files
- notification content
- blockchain gateway key
- issuer private key

This separation is deliberate. A public blockchain is a terrible place for personal data because deletion and correction are fundamentally awkward.

## 6. How an individual credential is issued

The primary code path begins in `credential.service.js`.

### Step 1: a credential is requested

When the API needs an individual trip credential, `ensureIndividual(tripId, userId)` checks that the trip exists and that the user is a trip member.

If an active credential already exists, the service reuses it rather than creating duplicates.

### Step 2: public and secret identifiers are generated

The service creates:

- a human-facing `publicId`
- a random token ID (`jti`)
- issue and expiry timestamps

The JWT used by the QR flow is generated separately. The blockchain does not receive that JWT.

### Step 3: the blockchain hash is created

The backend calculates:

```text
SHA-256("kavach:v1:INDIVIDUAL:<publicId>:<tripId>:<tokenId>")
```

That becomes `chainHash` in the credential row and `idHash` when sent to the gateway.

The trip ID is independently hashed as:

```text
SHA-256("kavach:v1:trip:<tripId>")
```

That becomes `tripHash`.

The prefixes such as `kavach:v1` are **domain separation**. They prevent different kinds of values from accidentally producing semantically interchangeable hashes.

### Step 4: the local database is updated first

The credential is stored in PostgreSQL with a blockchain state:

- `PENDING` when blockchain is enabled
- `DISABLED` when blockchain is intentionally disabled

The user's normal application request does not wait for the blockchain transaction to finish.

### Step 5: an async job is queued

`blockchainQueue.enqueue()` creates a `BlockchainAnchorJob` containing:

- operation: `ISSUE`
- entity type: `INDIVIDUAL`
- credential database ID
- payload hash
- trip/issue/expiry metadata required by the gateway
- state: `PENDING`

### Step 6: the worker claims the job

`blockchainAnchorJob` runs at `BLOCKCHAIN_WORKER_INTERVAL_MS` and asks the queue to process pending work.

A job moves from:

```text
PENDING -> PROCESSING
```

The claim is done with an update conditioned on `state=PENDING`, reducing the risk of two worker iterations processing the same row simultaneously.

### Step 7: the backend calls the gateway

`blockchain.service.js` sends:

```http
POST /v1/credentials/issue
Content-Type: application/json
x-kavach-chain-key: <shared gateway secret>
```

with a body conceptually like:

```json
{
  "idHash": "0x...",
  "tripHash": "0x...",
  "issuedAt": 1770000000,
  "expiresAt": 1770100000,
  "version": 1
}
```

Timestamps are converted from JavaScript dates to Unix seconds because the Solidity contract stores integer timestamps.

### Step 8: the gateway validates the request

The gateway verifies:

- the API key
- that hashes are exactly 32-byte hex values
- that the request body is valid JSON
- that the configured RPC/contract can perform the requested action

### Step 9: ethers.js signs and submits the transaction

The gateway creates:

- `JsonRpcProvider` from `CHAIN_RPC_URL`
- `Wallet` from `ISSUER_PRIVATE_KEY`
- `Contract` from `CONTRACT_ADDRESS`, ABI, and wallet

Calling `contract.issueId(...)` creates a transaction signed by the issuer wallet.

### Step 10: the gateway waits for confirmation

`await tx.wait()` waits for the transaction receipt. The gateway returns the receipt transaction hash to the backend.

### Step 11: the queue records the result

On success:

```text
BlockchainAnchorJob.state = CONFIRMED
Credential.chainStatus     = CONFIRMED
Credential.chainTxHash     = <transaction hash>
Credential.chainError      = null
```

The job row and credential row are updated together in a Prisma transaction so their local states do not drift apart easily.

## 7. Group credential issuance

Group credentials use the same pipeline with `entityType=GROUP`.

The hash input changes to identify the credential type:

```text
SHA-256("kavach:v1:GROUP:<publicId>:<tripId>:<tokenId>")
```

The group credential is a trust record for the group/trip credential itself. Individual members still receive their own individual credential when the application flow requires one.

The group QR/join mechanism and blockchain trust proof are related but not identical concepts. Possessing a QR is not authorization to silently join a group; the backend's membership and approval rules remain authoritative.

## 8. Extending a trip

When a trip expiry changes, `credentialService.extendTrip()` loads the trip's individual and group credentials.

For every non-revoked credential it:

1. updates the local `expiresAt`
2. sets chain state back to `PENDING` when blockchain is enabled
3. enqueues an `EXTEND` job
4. worker calls `POST /v1/credentials/extend`
5. gateway calls `TrustAnchor.extendId()`
6. confirmation sets the local chain state back to `CONFIRMED`

This means the application can update immediately while the chain catches up asynchronously.

## 9. Revoking a credential

Revocation follows the same pattern.

The backend first marks the credential revoked locally and queues a `REVOKE` job. The worker later calls:

```http
POST /v1/credentials/revoke
```

The gateway calls `TrustAnchor.revokeId(idHash, reasonCode)`.

The reason is represented as a small numeric code. Free-text private explanations are not written to the public chain.

## 10. QR verification flow

The QR credential itself is a signed JWT-based verification URL. Blockchain is an additional trust check, not the QR payload format.

Verification proceeds in layers:

```text
QR token
  |
  +--> verify JWT signature, issuer, audience, expiry
  |
  +--> load matching credential from PostgreSQL
  |
  +--> ensure token ID still matches
  |
  +--> check local credential and trip are active
  |
  +--> if chainStatus=CONFIRMED, query blockchain gateway
          |
          +--> GET /v1/credentials/:idHash
          |
          +--> TrustAnchor.verifyId(idHash)
```

The result is considered valid only when the required local conditions pass and, when blockchain verification is active, the on-chain status is `ACTIVE`.

If the chain is unavailable during verification, the service reports blockchain status as unavailable instead of fabricating a successful chain check.

## 11. Why the backend uses a queue instead of calling blockchain directly

A blockchain write can fail for reasons unrelated to the tourist's application request:

- RPC provider outage
- temporary network failure
- nonce conflict
- insufficient issuer wallet funds
- slow block confirmation
- gateway restart

If trip creation had to wait for a transaction, a five-second chain problem could unnecessarily break ordinary application behavior.

The queue provides **eventual consistency**: local application state is committed first and the trust layer catches up. Eventually consistent means two systems may briefly disagree while asynchronous work is pending, but the worker drives them toward the same intended state.

## 12. Job states and retry behavior

The queue uses these practical states:

```text
PENDING -> PROCESSING -> CONFIRMED
                     \
                      -> PENDING (retry)
                      -> FAILED  (attempt limit reached)
```

Retry delay uses exponential backoff capped at 60 seconds:

```text
min(60 seconds, 2^attempts seconds)
```

The purpose of backoff is to avoid hammering an already failing RPC or gateway continuously.

The credential stores a structured `chainError` containing fields such as:

- error code
- readable message
- whether the error is retryable
- HTTP status when available
- attempt count
- maximum attempts
- last attempt time

A previously failed credential can be requeued when it is read again through the credential service.

## 13. Failure codes you may see

The gateway and backend normalize failures so the UI/operator can see the actual reason rather than a useless `Blockchain failed` message.

Typical codes include:

- `BLOCKCHAIN_TIMEOUT`: gateway request exceeded the backend timeout
- `BLOCKCHAIN_GATEWAY_UNREACHABLE`: DNS/network/connection failure between backend and gateway
- `CHAIN_RPC_UNAVAILABLE`: gateway cannot reach the blockchain RPC provider
- `CHAIN_NONCE_ERROR`: issuer transaction nonce conflict/problem
- `ISSUER_INSUFFICIENT_FUNDS`: issuer wallet cannot pay gas
- `CONTRACT_REVERTED`: smart contract rejected the requested state transition
- `INVALID_BLOCKCHAIN_HASH`: request contained an invalid `bytes32` value
- `BLOCKCHAIN_GATEWAY_INVALID_RESPONSE`: backend received a non-JSON successful response
- `UNAUTHORIZED`: missing or invalid `x-kavach-chain-key`

## 14. Gateway authentication and health checks

All transaction/verification API routes require:

```text
x-kavach-chain-key: <GATEWAY_API_KEY>
```

Public health paths are intentionally outside this authentication boundary:

```text
GET  /
HEAD /
GET  /health
HEAD /health
GET  /healthz
HEAD /healthz
```

An uptime monitor should use `/healthz`.

The health response checks more than whether the Node process is alive. It asks the RPC provider for the network and checks that contract bytecode exists at the configured contract address.

Important fields include:

- `chainId`
- `expectedChainId`
- `chainMatches`
- `contractAddress`
- `contractDeployed`

A process can therefore be running while the health endpoint correctly returns `503` because the chain configuration is wrong.

## 15. Idempotency behavior

Distributed systems retry requests. A timeout can happen after a transaction actually succeeded, leaving the caller unsure whether it should retry.

The gateway handles this problem deliberately:

- issue: if the contract reports `ID_ALREADY_ISSUED`, the gateway verifies the existing record and accepts it when the expiry matches
- extend: if the desired expiry/status is already present, the repeated operation is treated as success
- revoke: if the record is already revoked, the repeated operation is treated as success

In those cases the response may contain:

```json
{
  "txHash": null,
  "idempotent": true
}
```

No new transaction was necessary because the desired chain state already existed.

## 16. Environment variables

### Blockchain gateway

The gateway needs:

```env
CHAIN_RPC_URL=https://...
CHAIN_ID=11155111
CONTRACT_ADDRESS=0x...
ISSUER_PRIVATE_KEY=0x...
GATEWAY_API_KEY=<long-random-secret>
GATEWAY_HOST=0.0.0.0
PORT=4100
```

`PORT` is normally injected by Render in production.

### Express backend

The backend needs only the gateway-facing settings:

```env
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_GATEWAY_URL=https://<gateway-host>
BLOCKCHAIN_GATEWAY_KEY=<same value as GATEWAY_API_KEY>
BLOCKCHAIN_CONTRACT_VERSION=1
BLOCKCHAIN_WORKER_INTERVAL_MS=5000
BLOCKCHAIN_MAX_ATTEMPTS=5
QR_TOKEN_SECRET=<separate-random-secret>
PUBLIC_APP_URL=https://<frontend-host>
```

The issuer private key belongs only in the gateway environment.

## 17. Security boundaries

The architecture intentionally separates secrets:

```text
Browser
  has: QR/JWT presented to that user
  must not have: database credentials, gateway key, issuer key

Express backend
  has: database credentials, QR secret, gateway key
  must not have: issuer private key

Blockchain gateway
  has: gateway key, issuer private key, RPC URL, contract address

Smart contract
  has: public state only
```

This is **least privilege**: each component receives only the secrets required for its job.

## 18. Privacy model

Blockchain records are public or at least replicated beyond the application database. KAVACH therefore uses hashes for trust anchors and encrypted ciphertext for the new recoverable identity/group snapshots, never plaintext personal records.

Do not add any of the following to contract calls without a serious privacy review:

- names
- email/phone
- government IDs
- precise coordinates
- evidence bytes
- medical details
- free-text incident descriptions
- JWTs or invitation tokens

Hashing does not magically make low-entropy personal data safe. The current credential hashes combine application-generated identifiers and token IDs, which makes direct guessing much harder than hashing a phone number by itself.

## 19. Deployment flow

The production sequence is:

```text
1. Choose blockchain network/RPC provider
2. Fund dedicated issuer wallet
3. Deploy TrustAnchor.sol
4. Save deployed CONTRACT_ADDRESS
5. Deploy blockchain gateway with RPC/address/private key/API key
6. Verify GET /healthz returns 200 and expected chain ID
7. Configure Express backend with gateway URL + matching gateway key
8. Enable BLOCKCHAIN_ENABLED
9. Restart backend so blockchain worker starts
10. Issue a test credential
11. Confirm DB job reaches CONFIRMED
12. Confirm txHash exists on explorer
13. Verify the QR and confirm chain status ACTIVE
```

For the detailed deployment commands, see [`deployment.md`](deployment.md).

## 20. Debugging checklist

If the UI says the blockchain operation failed, inspect the system from nearest component to farthest:

```text
A. Credential row
   chainStatus?
   chainError?
   chainTxHash?

B. BlockchainAnchorJob
   PENDING / PROCESSING / FAILED / CONFIRMED?
   attempts?
   lastError?

C. Backend -> gateway
   BLOCKCHAIN_ENABLED=true?
   correct URL?
   matching gateway key?

D. Gateway health
   /healthz = 200?
   expected chain ID?
   contractDeployed=true?

E. Gateway transaction requirements
   issuer wallet funded?
   RPC reachable?
   contract call reverting?

F. Chain
   tx hash confirmed?
   verifyId(idHash) returns expected state?
```

This order prevents wasting time debugging Solidity when the real problem is an environment variable, an ancient and beloved software-engineering tradition.

## 21. Source map

| Concern | File |
|---|---|
| Credential lifecycle | `server/src/modules/credential/credential.service.js` |
| Credential persistence | `server/src/modules/credential/credential.repository.js` |
| Hashing + gateway HTTP client | `server/src/integrations/blockchain/blockchain.service.js` |
| DB-backed chain queue | `server/src/integrations/blockchain/blockchain.queue.js` |
| Background queue worker | `server/src/jobs/blockchainAnchor.job.js` |
| Gateway HTTP API | `blockchain/gateway/server.ts` |
| Smart contract | `blockchain/contracts/TrustAnchor.sol` |
| Contract deployment | `blockchain/scripts/deploy.ts` |
| Contract tests | `blockchain/test/` |
| Backend blockchain catalogue | `server/documentation/BLOCKCHAIN-CATALOGUE.md` |

## 22. One-sentence mental model

**KAVACH keeps private, fast-changing application data in PostgreSQL, hashes the identity of important trip credentials, asynchronously records those hashes and lifecycle states through an isolated gateway into `TrustAnchor.sol`, and consults that trust record during verification without exposing blockchain keys or personal data to the user.**

## 23. Current encrypted snapshot workflow

### Individual trip

```text
create/obtain individual credential
 -> existing idHash ISSUE job
 -> require DOB
 -> build canonical individual snapshot
 -> SHA-256 payloadHash
 -> AES-256-GCM ciphertext
 -> SNAPSHOT queue job (type 1, sequence 1)
 -> gateway /v1/snapshots/append
 -> TrustAnchor.appendDataSnapshot
```

Protected snapshot fields are name, DOB, destination, phone and email. During a planned/active trip the tourist cannot edit name/DOB/email/phone. Every minute the server can read `getLatestDataSnapshot`, decrypt it, verify `payloadHash` and identity, compare PostgreSQL, and restore differences with an audit event.

### Group history

Group creation appends sequence 1 with group name, current member count, destination and leader contact identity. Each later accepted member appends sequence N+1 containing the new member plus the updated count. Existing snapshots are immutable history and are never rewritten.

### Privacy boundary

Ciphertext, payload hash, sequence, snapshot type, timestamp and sender are public-chain material. The snapshot encryption secret remains only in the main backend environment. Neither frontend nor smart contract can decrypt PII.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

