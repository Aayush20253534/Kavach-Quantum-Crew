# Tourist Email Verification

> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Purpose

New tourist accounts must prove access to their email address before normal authenticated use. The OTP is required for first-time signup verification and again if the tourist later changes email. It is **not** required on every login.

## Flow

```text
POST /auth/register
   -> create TOURIST with emailVerifiedAt = null
   -> generate cryptographically random 6-digit OTP
   -> hash using userId + OTP + EMAIL_OTP_SECRET
   -> store EmailVerificationOtp record
   -> send OTP via Gmail SMTP/Nodemailer
   -> return verificationRequired=true (no normal session)

POST /auth/verify-email
   -> validate email + exactly 6 digits
   -> enforce expiry/attempt limit
   -> constant-time hash comparison
   -> set emailVerifiedAt
   -> delete OTP record
   -> create refresh session + access token
```

## Defaults

| Setting | Default |
|---|---:|
| OTP digits | 6 |
| Expiry | 10 minutes |
| Resend cooldown | 60 seconds |
| Maximum invalid attempts | 5 |

## Gmail environment

```env
GMAIL_USER=project.sender@gmail.com
GMAIL_APP_PASSWORD=your_google_app_password
EMAIL_FROM=project.sender@gmail.com
EMAIL_OTP_SECRET=generate-a-strong-random-secret
EMAIL_OTP_TTL_MINUTES=10
EMAIL_OTP_RESEND_COOLDOWN_SECONDS=60
EMAIL_OTP_MAX_ATTEMPTS=5
```

`GMAIL_USER` and `EMAIL_FROM` should normally be the same dedicated Gmail address. `GMAIL_APP_PASSWORD` is the Google App Password created after enabling 2-Step Verification; it is not the normal Gmail password.

## APIs

### Register

`POST /api/v1/auth/register`

```json
{
  "name": "OTP Test User",
  "username": "otptestuser01",
  "email": "receiver@example.com",
  "phone": "+919876543210",
  "password": "Tourist123",
  "confirmPassword": "Tourist123"
}
```

The account is created but remains unverified. If Gmail delivery fails, the account is kept and the client can later call resend.

### Verify

`POST /api/v1/auth/verify-email`

```json
{
  "email": "receiver@example.com",
  "otp": "483921"
}
```

Successful verification marks the current email verified and issues the initial access/refresh session. The code is single-use because the OTP record is deleted.

### Resend

`POST /api/v1/auth/resend-verification`

```json
{
  "email": "receiver@example.com"
}
```

The response is deliberately generic. During cooldown the backend accepts the request without sending another code. After cooldown, a fresh OTP replaces the previous active code.

## Login behavior

Before verification, correct password login still fails with `EMAIL_VERIFICATION_REQUIRED`. After verification, future logins use normal credentials and do not send another OTP. Refresh and Socket.IO authentication also require a verified tourist email.

## Email changes

When a verified tourist changes email, `emailVerifiedAt` is cleared and refresh sessions are revoked. The new address must be verified before normal authenticated use continues.

## Security notes

- OTP generation uses Node.js cryptographic randomness.
- Raw OTP values are never stored in PostgreSQL.
- Verification uses keyed hashing and timing-safe comparison.
- OTP expiry and attempt limits reduce brute-force lifetime.
- Resend cooldown reduces abuse/spam.
- Existing tourists were backfilled as verified by the migration so deployment does not unexpectedly lock out current users.

## Postman smoke test

1. Register with a fresh real email.
2. Confirm the response requires verification and no normal authenticated session is issued.
3. Attempt login before verification; expect `EMAIL_VERIFICATION_REQUIRED`.
4. Check inbox/spam and copy the six-digit OTP.
5. Try one wrong OTP; confirm rejection.
6. Verify with the real OTP; confirm access token/session issuance.
7. Login normally; confirm no new OTP is required.
8. For resend testing, register another account, call resend immediately (cooldown), then after 60 seconds request a replacement code and verify the new code.
9. Inspect `EmailVerificationOtp` in Prisma Studio and confirm the raw OTP is absent.
