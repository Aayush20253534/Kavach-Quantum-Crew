# Blockchain Deployment

Deployment has two independent deliverables:

1. the Solidity contract on the target chain;
2. the HTTP blockchain gateway that holds the issuer signer and talks to that contract.

## 1. Install/build

```bash
cd blockchain
npm install
npm run build
npm test
```

Hardhat compilation produces contract artifacts used by scripts/tests.

## 2. Required chain environment

```env
CHAIN_RPC_URL=https://...
CHAIN_ID=11155111
CONTRACT_ADDRESS=0x...
CONTRACT_VERSION=trust-anchor-v1
ISSUER_PRIVATE_KEY=0x...
GATEWAY_API_KEY=<long random secret>
GATEWAY_HOST=0.0.0.0
GATEWAY_PORT=4100
GATEWAY_READINESS_TIMEOUT_MS=5000
```

Legacy aliases `address` and `privateKey` are currently accepted by the gateway for compatibility, but new deployments should use uppercase names.

## 3. Contract deployment

For a local node:

```bash
npm run node
npm run deploy:localhost
```

For configured testnet:

```bash
npm run deploy:testnet
```

Deployment metadata is written under `deployments/` and includes network/chain ID, contract address, deployer, block, timestamp, version, and ABI path.

The checked-in `deployments/sepolia.json` identifies the current repository's Sepolia deployment metadata. Environment configuration should still be treated as the runtime authority because a redeployment can change the address.

## 4. Issuer funding and authorization

The gateway wallet must:

- have enough native network currency for gas;
- be authorized in `TrustAnchor.authorizedIssuers`.

The deployer is authorized automatically. A different production issuer address must be authorized by the contract admin before writes can succeed.

## 5. Gateway deployment

Build/start:

```bash
npm run build
npm start
```

Or development:

```bash
npm run gateway
```

In production the gateway binds to `0.0.0.0` and uses the platform-provided `PORT` when present.

## 6. Health checks

Use liveness for platform process health:

```text
GET /health
```

Use readiness for deployment validation:

```text
GET /ready
```

A gateway can be live but not ready when:

- RPC is unreachable;
- chain ID differs from configured `CHAIN_ID`;
- no bytecode exists at `CONTRACT_ADDRESS`.

## 7. Main-backend configuration

The main backend should receive:

```env
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_GATEWAY_URL=https://<gateway>
BLOCKCHAIN_GATEWAY_KEY=<same as GATEWAY_API_KEY>
BLOCKCHAIN_CONTRACT_VERSION=1
BLOCKCHAIN_MAX_ATTEMPTS=...
BLOCKCHAIN_DATA_ENCRYPTION_KEY=<strong secret>
```

The main backend does **not** need `ISSUER_PRIVATE_KEY` when using the gateway architecture.

## 8. Secret placement

```text
Frontend
  no chain private key
  no gateway API key
  no snapshot encryption key

Main backend
  gateway URL/key
  snapshot encryption key
  no issuer private key

Blockchain gateway
  RPC URL
  contract address
  issuer private key
  gateway API key
  no snapshot decryption key
```

## 9. Smoke-test order

1. `GET /health` -> 200.
2. `GET /ready` -> 200 and expected chain ID/address deployed.
3. From the main backend, create/obtain a trip credential.
4. Verify a blockchain job moves from PENDING to CONFIRMED.
5. Verify QR credential shows chain ACTIVE after confirmation.
6. Verify latest snapshot exists for the credential.
7. Exercise integrity reconciliation in a controlled test environment.

## 10. Common failures

| Code/condition | Meaning |
|---|---|
| `CHAIN_RPC_UNAVAILABLE` | RPC/network unavailable |
| `ISSUER_INSUFFICIENT_FUNDS` | signer cannot pay gas |
| `CHAIN_NONCE_ERROR` | transaction nonce problem |
| `CONTRACT_REVERTED` | Solidity rule rejected operation |
| `INVALID_BLOCKCHAIN_HASH` | protected input was not bytes32 |
| `UNAUTHORIZED` | wrong/missing gateway API key |
| readiness 503 | process alive but chain/contract not ready |

The backend classifies retryable failures and keeps them in the asynchronous job workflow rather than crashing core trip operations.
