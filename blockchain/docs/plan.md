# Blockchain Integration: Current Implementation and Operational Plan

This document describes the current architecture and the rules for operating/extending it.

## Current components

- `contracts/TrustAnchor.sol` — proof/credential anchor contract.
- `gateway/server.ts` — isolated HTTP signing gateway.
- `adapter/` — canonicalization, hashing, privacy scan, chain client, job helpers and HTTP contract formatters/routes.
- `scripts/` — deploy/issue/revoke/verify/anchor utilities.
- `test/` — access control, issue/revoke, idempotency, incident/evidence anchoring tests.
- main backend `BlockchainAnchorJob` queue/worker — asynchronous integration boundary.

## Trust boundary

```text
Main Express API
  holds: gateway URL/key, application encryption key
  does not hold: issuer private key
          │
          ▼
Blockchain gateway
  holds: RPC URL, contract address, issuer private key
          │
          ▼
EVM / TrustAnchor.sol
```

## Current proof workflow

```text
domain event
 → canonical payload
 → privacy validation
 → hash/encrypted permitted snapshot where configured
 → durable anchor job
 → authenticated gateway request
 → contract transaction
 → receipt/reference
 → persist job/proof status
```

## Operational rules

- PostgreSQL is primary mutable application storage.
- Do not publish raw medical/profile/location/secrets on-chain.
- Treat retries/idempotency as mandatory because RPC/gateway failures are normal distributed-system events.
- Rotate gateway API key separately from issuer private key.
- Keep one stable contract address/version per intended deployment environment.
- Verify deployed bytecode/contract ownership before production issue calls.

## Deployment plan

1. deploy contract to target network,
2. record `CONTRACT_ADDRESS`, chain ID and version,
3. configure gateway RPC + issuer key + gateway API key,
4. deploy gateway,
5. configure matching `BLOCKCHAIN_GATEWAY_KEY` in main backend,
6. enable `BLOCKCHAIN_ENABLED`,
7. run issue/verify smoke test,
8. test gateway outage and retry behavior,
9. monitor failed anchor jobs.

## Extension criteria

Any new on-chain proof type should define canonical fields, privacy classification, hash/idempotency key, contract method/event, gateway request/response schema, retry semantics, verification semantics, and tests before being wired into application flows.
