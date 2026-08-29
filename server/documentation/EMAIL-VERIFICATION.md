# Email Verification and Password Recovery

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Email OTP flows are owned by `src/modules/auth/email.service.js`. Delivery uses the shared Mailjet client and Mailjet Send API v3.1.

Required variables:

```env
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_SENDER_EMAIL=verified-sender@example.com
MAILJET_SENDER_NAME=QuantumCrew
EMAIL_OTP_SECRET=...
EMAIL_OTP_TTL_MINUTES=10
EMAIL_OTP_RESEND_COOLDOWN_SECONDS=60
EMAIL_OTP_MAX_ATTEMPTS=5
```

The sender address must be verified in Mailjet. OTP material should remain short-lived, attempt-limited and never logged in production.
