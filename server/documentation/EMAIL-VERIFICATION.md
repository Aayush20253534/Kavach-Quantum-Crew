# Email Verification and Password-Recovery Flow

> Current provider: **Mailjet Send API v3.1**. OTP generation/verification remains backend logic; Mailjet only transports the message.

## Why email verification exists

A newly registered tourist must prove control of the supplied email address before the normal authenticated account flow is considered complete. The code is six digits, expires after a configured TTL, has a resend cooldown, and has a maximum failed-attempt count.

## Registration sequence

```text
POST /api/v1/auth/register
  → validate/normalize identity fields
  → hash password with Argon2
  → create unverified user
  → generate 6-digit OTP
  → persist protected OTP record + expiry/attempt metadata
  → emailService.sendVerificationOtp()
  → sendMailjetEmail()
  → Mailjet /v3.1/send
```

The Mailjet sender address must be verified. If provider delivery fails, the API returns a controlled email-delivery error; the domain service can retain the account/OTP state so resend can be attempted according to business rules.

## Verification sequence

```text
POST /api/v1/auth/verify-email
  body: email + otp
  → active OTP lookup
  → expiry check
  → failed-attempt check
  → constant/safe verification logic
  → set emailVerifiedAt
  → invalidate/consume OTP
  → issue authenticated session
```

## Resend

`POST /api/v1/auth/resend-verification`

- respects `EMAIL_OTP_RESEND_COOLDOWN_SECONDS`,
- generates a new code,
- replaces/invalidates the previous active code,
- returns a deliberately generic response where needed to avoid account enumeration.

## Password reset

Password recovery uses a separate OTP record/flow:

```text
POST /auth/password-reset/request
POST /auth/password-reset/verify
POST /auth/password-reset/reset
```

The reset email is also delivered through Mailjet but uses the password-reset OTP model/rules rather than the registration-verification record.

## Required environment

```env
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_SENDER_EMAIL=verified-sender@example.com
MAILJET_SENDER_NAME=QuantumCrew
EMAIL_OTP_SECRET=strong-random-secret
EMAIL_OTP_TTL_MINUTES=10
EMAIL_OTP_RESEND_COOLDOWN_SECONDS=60
EMAIL_OTP_MAX_ATTEMPTS=5
```

## Mailjet request shape

The shared client sends `POST https://api.mailjet.com/v3.1/send` with HTTP Basic authentication and a `Messages` array containing `From`, `To`, `Subject`, `TextPart`, and `HTMLPart`. It inspects both HTTP status and Mailjet message status/errors before reporting success.

## Security properties

- The raw provider secret is never sent to the browser.
- OTP codes are time-limited.
- Resend is throttled.
- Incorrect attempts are bounded.
- Login/session state is controlled by the backend, not Mailjet.
- Email verification and password reset use separate records/purposes.
- Production logs should never print OTP values or Mailjet secret keys.

## Manual smoke test

1. Configure a **verified** Mailjet sender.
2. Start PostgreSQL and the backend.
3. Register a fresh test tourist.
4. Confirm the message arrives at the recipient mailbox.
5. Verify using the six-digit code.
6. Confirm `/auth/me` works with the issued access token.
7. Register another account and verify immediate resend is throttled.
8. Wait past the cooldown, resend, and confirm the old code no longer succeeds.
9. Test an expired code and too many wrong attempts.
10. Test password-reset request/verify/reset separately.

## Common failures

| Symptom | Likely cause |
|---|---|
| `EMAIL_PROVIDER_NOT_CONFIGURED` | Mailjet key/secret/sender missing |
| `EMAIL_DELIVERY_FAILED` | provider rejected verification message |
| provider HTTP 4xx | bad credentials, unverified sender, malformed recipient/message |
| provider HTTP 5xx | temporary Mailjet failure |
| OTP always invalid | wrong email/code, expired/replaced code, max attempts reached |
| frontend loops on verification | session transition/redirect logic, not Mailjet itself |
