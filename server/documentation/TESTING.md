# Testing Guide

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
