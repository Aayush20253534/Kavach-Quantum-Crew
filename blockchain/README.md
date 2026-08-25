# KAVACH Blockchain Trust Layer

The `blockchain/` workspace contains the EVM trust anchor used by KAVACH for privacy-preserving trip credential proofs and additional evidence/incident/consent anchors.

> **Verified:** 24 August 2026. The production integration boundary is the authenticated HTTP gateway in `gateway/server.ts`. Older documents that describe importing the adapter directly into the Express service are historical design notes and are not the current deployment architecture.

## Workflow and architecture

Start with [`docs/workflow.md`](docs/workflow.md) for the current end-to-end flow from QR credential creation in Express, through the database-backed queue and gateway, to `TrustAnchor.sol`, including failure handling, security boundaries, verification, and plain-language blockchain terms.

## What is on-chain

`contracts/TrustAnchor.sol` supports:

- digital trip credential issue, extend, revoke, and verify
- authorized issuer administration
- evidence hash anchoring and verification
- incident hash anchoring and verification
- consent hash anchoring and verification

Credential/evidence/incident anchors use hash-derived proofs and minimal metadata. The latest contract also stores AES-GCM encrypted identity/group snapshot ciphertext. Plaintext tourist names, DOBs, emails, phones, precise locations, medical records, documents, and raw evidence are not written directly on-chain.

## Current server integration

```text
server/ BlockchainAnchorJob
          │
          │ x-kavach-chain-key
          ▼
blockchain/gateway/server.ts
          │
          │ ethers + issuer wallet
          ▼
TrustAnchor.sol on EVM network
```

The Express backend does not need `CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, or `ISSUER_PRIVATE_KEY`. Those belong only to the gateway runtime.

## Gateway API

Public health endpoints (no gateway API key required):

```text
GET  /
GET  /health
GET  /healthz
HEAD /
HEAD /health
HEAD /healthz
```

Use `/healthz` for external uptime monitors so monitoring is clearly separated from authenticated gateway API routes.

Authenticated with `x-kavach-chain-key`:

```text
POST /v1/credentials/issue
POST /v1/credentials/extend
POST /v1/credentials/revoke
GET  /v1/credentials/:idHash
```

The gateway validates `bytes32` identifiers, waits for transaction receipts, and treats already-applied issue/extend/revoke operations as idempotent when the current chain state matches the requested state.

## Folder structure

```text
blockchain/
├── contracts/TrustAnchor.sol
├── gateway/server.ts
├── adapter/                 canonicalization, hashing, queue/client utilities
├── scripts/                 deploy/manual chain operations
├── test/                    Hardhat tests
├── docs/                    design and deployment notes
├── hardhat.config.ts
├── tsconfig.json
└── tsconfig.gateway.json
```

## Environment

Copy `.env.example` to `.env` and configure:

```dotenv
CHAIN_RPC_URL=
CHAIN_ID=11155111
CONTRACT_ADDRESS=
ISSUER_PRIVATE_KEY=
GATEWAY_API_KEY=
GATEWAY_HOST=127.0.0.1
GATEWAY_PORT=4100
```

Legacy aliases `address` and `privateKey` are still accepted by the gateway, but new deployments should use uppercase names.

The same secret must be configured on the backend as:

```dotenv
BLOCKCHAIN_GATEWAY_KEY=<same value as GATEWAY_API_KEY>
```

## Local development

Install:

```bash
npm ci
```

Start a local chain:

```bash
npm run node
```

Deploy in a second terminal:

```bash
npm run deploy:localhost
```

Update `.env` with the deployed address, then start the gateway:

```bash
npm run gateway
```

Production-style TypeScript build:

```bash
npm run build
npm start
```

## Testnet deployment

Configure `CHAIN_RPC_URL`, `CHAIN_ID`, and `ISSUER_PRIVATE_KEY`, then:

```bash
npm run deploy:testnet
```

Copy the resulting contract address into `CONTRACT_ADDRESS` before starting the gateway. Keep the issuer key in the blockchain service only.

## Testing

```bash
npm test
```

The suite covers:

- credential issue/revoke behavior
- evidence anchors
- incident anchors
- issuer access control
- idempotency regression behavior

See `test/README.md` for fixture details.

## Failure model

The blockchain is a trust layer, not the primary application database. PostgreSQL remains authoritative for application workflow. The server persists blockchain anchor jobs and retries asynchronous writes. The UI should surface pending/failed chain state accurately rather than converting it to success.

The gateway's idempotent endpoints make retries safe when a transaction actually succeeded but the caller did not receive the response.

## Production hosting

The gateway can run as a separate Node service on Render or another host:

```text
Build: npm install && npm run build
Start: npm start
Health: /health
```

Render injects `PORT`; the gateway binds to `0.0.0.0` by default. Use a public RPC endpoint or managed node. A local Hardhat node is for development, not production.

## Security checklist

- never expose `ISSUER_PRIVATE_KEY` to frontend or main API runtime
- rotate `GATEWAY_API_KEY` if leaked
- restrict issuer permissions on-chain
- use a dedicated issuer wallet
- verify expected `CHAIN_ID` and deployed bytecode through `/health`
- keep raw personal/evidence data off-chain
- monitor failed server anchor jobs and gateway/RPC health

## Related documentation

- `docs/deployment.md`
- `docs/implementation.md`
- `docs/plan.md`
- `../server/documentation/BLOCKCHAIN-CATALOGUE.md`

## Encrypted append-only trip snapshots

The latest contract keeps the original digital-ID mapping and adds append-only `DataSnapshot[]` history keyed by credential `idHash`. Plaintext PII is **not** stored directly on-chain. The main backend canonicalizes snapshot JSON, hashes it, encrypts it with AES-256-GCM, and submits `{ idHash, payloadHash, ciphertext, sequence, snapshotType }` through the gateway.

- Snapshot type `1`: individual trip identity (`name`, `dateOfBirth`, `destination`, `phone`, `email`, IDs).
- Snapshot type `2`: group history (`groupName`, `memberCount`, destination, leader contact identity, and the newly added member for membership-change snapshots).
- Group creation writes sequence 1; every accepted new member appends the next sequence. Previous snapshots are never overwritten.
- The server runs a periodic integrity job that reads/decrypts the latest individual snapshot and can restore protected PostgreSQL fields if they differ.

Because snapshots change the contract ABI, redeploy `TrustAnchor.sol` and update `CONTRACT_ADDRESS` before enabling this backend version.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

