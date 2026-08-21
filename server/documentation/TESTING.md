# Testing Guide

## Final regression

From `server/`:

```powershell
npm ci
npm run prisma:generate
npm run prisma:validate
npm test
npm run lint
npm run format:check
npx prisma migrate status
```

`npm test` discovers all `tests/phase*/**/*.test.js` suites and is the final regression command.

The repository includes tests for server/database lifecycle, auth/RBAC, trips/groups/tracking, safety/geofencing, SOS/incidents, realtime, responders, hazards, monitoring, dispatch, communication, evidence, admin, analytics, provider boundaries, notification delivery, security, audit, and observability.

Targeted suites are useful for debugging but do not replace the full regression before merge/release.
