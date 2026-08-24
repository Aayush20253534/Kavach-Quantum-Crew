# KAVACH Blockchain Trust Layer

The `blockchain/` workspace contains the EVM trust anchor used by KAVACH for privacy-preserving trip credential proofs and additional evidence/incident/consent anchors.

> **Verified:** 24 August 2026. The production integration boundary is the authenticated HTTP gateway in `gateway/server.ts`. Older documents that describe importing the adapter directly into the Express service are historical design notes and are not the current deployment architecture.

## What is on-chain

`contracts/TrustAnchor.sol` supports:

- digital trip credential issue, extend, revoke, and verify
- authorized issuer administration
- evidence hash anchoring and verification
- incident hash anchoring and verification
- consent hash anchoring and verification

Only hash-derived proofs and minimal metadata are written to the contract. Tourist names, phones, precise locations, medical records, documents, and raw evidence remain off-chain.

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
