# Deployment Guide

## Pre-deployment
1. Node.js 20.19+ and npm 10+.
2. PostgreSQL/Neon provisioned.
3. Production environment secrets configured.
4. CORS restricted.
5. HTTPS/reverse proxy configured.
6. Durable evidence-storage strategy chosen.
7. External providers configured only when ready.

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
- `GET /health`
- `GET /health/ready`
- `GET /health/database`
- `GET /api/v1`

With System Admin credentials:
- `GET /api/v1/observability/metrics`
- `GET /api/v1/observability/diagnostics`

When behind a proxy, configure WebSocket upgrades and `TRUST_PROXY` correctly.

Local `storage/evidence` is not sufficient for hosts with ephemeral filesystems; use durable storage.
