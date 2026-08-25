# Deployment Guide

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Pre-deployment
1. Node.js 20.19+ and npm 10+.
2. PostgreSQL/Neon provisioned.
3. Production environment secrets configured, including Gmail SMTP App Password and `EMAIL_OTP_SECRET`.
4. CORS restricted.
5. HTTPS/reverse proxy configured.
6. Durable evidence-storage strategy chosen.
7. Gmail sender account has 2-Step Verification + App Password configured.
8. External AI/blockchain/notification providers configured only when ready.

## Install and verify

```powershell
npm ci
npm run prisma:generate
npm run prisma:validate
npm run lint
npm test
npm run prisma:migrate:deploy
npx prisma migrate status
```

## Start

```powershell
npm start
```

## Verify

Check:
- `GET /`
- `GET /health`
- `GET /health/ready`
- `GET /health/database`
- `GET /api/v1`

With System Admin credentials:
- `GET /api/v1/observability/metrics`
- `GET /api/v1/observability/diagnostics`

When behind a proxy, configure WebSocket upgrades and `TRUST_PROXY` correctly.

Local `storage/evidence` is not sufficient for hosts with ephemeral filesystems; use durable storage.

## Gmail verification deployment check

Before starting production, set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM`, and a strong `EMAIL_OTP_SECRET`. The production environment validator rejects missing Gmail credentials and weak/default OTP secrets. After deployment, perform one real signup/verify/login smoke test using a test mailbox.

## Emergency dispatch deployment requirement

Deployments must apply the Prisma migration that creates `emergency_service_accounts` and emergency-unit location columns. The Docker image now runs `prisma migrate deploy` before the server process. Ensure `DATABASE_URL` is available at container startup and migration permissions are granted.

## Latest contract and migration deployment order

1. Back up PostgreSQL.
2. Apply the committed Prisma migration adding `User.dateOfBirth` and `TripGroup.name`.
3. Deploy the updated `TrustAnchor.sol` to the configured chain.
4. Update the blockchain gateway `CONTRACT_ADDRESS`.
5. Configure the same stable `BLOCKCHAIN_DATA_ENCRYPTION_KEY` on every backend instance that performs snapshot encryption/reconciliation.
6. Deploy/restart the blockchain gateway, then the main backend.
7. Verify `/`/health endpoints, issue a test credential, confirm snapshot append, and confirm latest-snapshot retrieval/decryption.
8. Test danger-zone notification, signal-loss timeout/reminder, manual Disaster Management dispatch, responder email, and responder live tracking.

Do not deploy the backend snapshot code against the old contract address; credential issuance may still work while snapshot calls fail, creating a misleading partial deployment.
