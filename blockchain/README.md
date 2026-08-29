# KAVACH Blockchain Trust Anchor

`blockchain/` contains the EVM trust-anchor contract and the isolated authenticated signing gateway used by the main KAVACH backend.

## Security boundary

The browser never receives the issuer private key. The main Express API calls the gateway over HTTP using `BLOCKCHAIN_GATEWAY_KEY`; the gateway holds the EVM signer and calls `TrustAnchor.sol`.

## Local run

```bash
cp .env.example .env
npm ci
npm run node
```

Deploy locally in another terminal:

```bash
npm run deploy:localhost
npm run gateway
```

## Stored chain data

The contract anchors hash-derived credential identity/status information and encrypted append-only data snapshots. PostgreSQL remains the primary application store. Plaintext medical/profile/contact data should not be intentionally published directly on-chain.

## Credential lifecycle

```text
trip/group/member event
  → DB credential + anchor job
  → authenticated gateway
  → issue / extend / revoke on TrustAnchor
```

Blockchain availability is not part of the emergency critical path: SOS, live tracking, incident escalation and dispatch continue if anchoring is temporarily unavailable.

See `docs/` for workflow, deployment, implementation and data-integrity details.
