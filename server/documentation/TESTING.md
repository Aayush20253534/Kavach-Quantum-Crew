# Testing Guide

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Final regression

From `server/`:

```powershell
npm ci
npm run prisma:generate
npm run prisma:validate
npm run test:email-otp
npm test
npm run lint
npm run format:check
npx prisma migrate status
```

`npm test` discovers all `tests/phase*/**/*.test.js` suites and is the final regression command.

The repository includes tests for Gmail email service behavior, six-digit OTP validation/expiry/attempt handling, unverified REST/Socket.IO blocking, server/database lifecycle, auth/RBAC, trips/groups/tracking, safety/geofencing, SOS/incidents, realtime, responders, hazards, monitoring, dispatch, communication, evidence, admin, analytics, provider boundaries, notification delivery, security, audit, and observability.

Targeted suites are useful for debugging but do not replace the full regression before merge/release.

## Manual OTP verification

After automated tests pass, use a fresh real receiving email in Postman:

1. `POST /api/v1/auth/register` and confirm `verificationRequired: true`.
2. Confirm a six-digit code arrives in the mailbox.
3. Confirm login fails before verification with `EMAIL_VERIFICATION_REQUIRED`.
4. Send a wrong OTP and confirm rejection.
5. `POST /api/v1/auth/verify-email` with the real code and confirm session issuance.
6. Confirm future login works without OTP.
7. Register another user and test resend cooldown/replacement-code behavior.
8. Inspect Prisma Studio to confirm no plaintext OTP is stored.

## Emergency dispatch test coverage

Tests for this feature should cover service registration validation/conflicts, role-aware login, geolocation validation, nearest-unit ranking, no-location/no-unit failures, ownership checks, dispatch state transitions, tourist tracking authorization, realtime publishing, and migration startup. Existing Phase 15 dispatch tests should remain valid because manual dispatch APIs are preserved.

## Latest regression scenarios

- Create an individual trip with DOB populated; assert credential issue and encrypted individual snapshot are queued/confirmed.
- During `PLANNED`/`ACTIVE`, attempt to change name/DOB/email/phone through the tourist API and assert rejection.
- Modify one protected database field in a controlled test database; run integrity reconciliation and assert it is restored from a valid blockchain snapshot with `BLOCKCHAIN_DB_RESTORED` audit metadata.
- Create a group and assert snapshot sequence 1. Approve/join a new member and assert a new append-only snapshot with incremented member count and `addedMember`.
- Scan the group QR with a generic scanner and verify it opens the HTTPS join route.
- Keep a non-leader member offline beyond the tracking threshold; assert leader + Disaster Management notifications, 5-minute response window, timeout escalation, and 5-minute post-response reminder behavior.
- Assert danger-zone/signal-loss creation does not email responders. Then initiate Disaster Management dispatch and assert responder email/realtime dispatch.
- Publish responder GPS and verify authorization from tourist, Disaster Management, and assigned responder contexts.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

## Current regression scenarios

Regression tests/manual QA should cover immediate danger-zone evaluation at trip start, five-minute signal-loss response/reminder cycles, Disaster-Management-controlled responder assignment, individual blockchain self-repair, group blockchain approval/recovery, and `INTEGRITY_UNAVAILABLE` when a snapshot cannot be safely read.
