# Environment Configuration

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


Use `.env.example` as the source of defaults. Never commit real `.env` secrets.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Runtime mode |
| `APP_NAME` | Service identity |
| `APP_VERSION` | Service version |
| `HOST` | Bind host |
| `PORT` | HTTP port |
| `API_PREFIX` | REST prefix |
| `DATABASE_URL` | PostgreSQL connection |
| `DATABASE_POOL_MAX` | DB pool maximum |
| `DATABASE_CONNECTION_TIMEOUT_MS` | DB connect timeout |
| `CORS_ORIGINS` | Browser/Socket.IO allow-list |
| `CORS_CREDENTIALS` | Credentialed CORS toggle |
| `SOCKET_IO_ENABLED` | Realtime toggle |
| `JSON_BODY_LIMIT` | JSON body-size limit |
| `RATE_LIMIT_WINDOW_MS` | Global rate-limit window |
| `RATE_LIMIT_MAX` | Global rate-limit allowance |
| `SENSITIVE_RATE_LIMIT_WINDOW_MS` | Sensitive-route window |
| `SENSITIVE_RATE_LIMIT_MAX` | Sensitive-route allowance |
| `SECURITY_MAX_OBJECT_DEPTH` | Request nesting limit |
| `SECURITY_MAX_OBJECT_KEYS` | Request field-count limit |
| `TRUST_PROXY` | Proxy trust policy |
| `LOG_LEVEL` | Structured logging level |
| `SHUTDOWN_TIMEOUT_MS` | Graceful shutdown budget |
| `ACCESS_TOKEN_SECRET` | Access JWT secret |
| `REFRESH_TOKEN_SECRET` | Refresh JWT secret |
| `ACCESS_TOKEN_TTL` | Access-token TTL |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh-session TTL |
| `JWT_ISSUER` | JWT issuer |
| `JWT_AUDIENCE` | JWT audience |
| `REFRESH_COOKIE_NAME` | Refresh cookie |
| `SEED_ADMIN_*` | System Admin seed values. Development has demo fallbacks; production requires explicit email/password. |
| `SEED_DM_*` | Optional Disaster Manager seed |
| `INCIDENT_ACK_TIMEOUT_MINUTES` | Escalation acknowledgement threshold |
| `INCIDENT_ESCALATION_INTERVAL_MINUTES` | Repeat escalation interval |
| `GMAIL_USER` | Gmail sender/login account used by Nodemailer |
| `GMAIL_APP_PASSWORD` | Google 16-character App Password; never use the normal Gmail password |
| `EMAIL_FROM` | Visible From address; normally the same as `GMAIL_USER` |
| `EMAIL_OTP_SECRET` | Secret used to key/hash OTP values; strong unique production value required |
| `EMAIL_OTP_TTL_MINUTES` | OTP validity period; default 10 minutes |
| `EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | Minimum resend interval; default 60 seconds |
| `EMAIL_OTP_MAX_ATTEMPTS` | Maximum wrong attempts before active OTP invalidation; default 5 |

Production rules:
- use separate strong access/refresh secrets,
- restrict CORS to deployed frontend origins,
- enable HTTPS,
- configure `TRUST_PROXY` to the real proxy topology,
- keep DB/provider/service-account secrets outside Git.

## Gmail email verification

| Variable | Purpose |
|---|---|
| `GMAIL_USER` | Gmail account used to send tourist verification email |
| `GMAIL_APP_PASSWORD` | Google App Password generated after enabling 2-Step Verification |
| `EMAIL_FROM` | Sender address shown to recipients; normally same Gmail account |
| `EMAIL_OTP_SECRET` | Server-side secret used when hashing OTP values before persistence |
| `EMAIL_OTP_TTL_MINUTES` | Verification-code lifetime; default 10 minutes |
| `EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | Minimum time between resend attempts; default 60 seconds |
| `EMAIL_OTP_MAX_ATTEMPTS` | Wrong-code attempt limit before current OTP is invalidated; default 5 |

Do not use the normal Gmail account password. Use a dedicated Google App Password and keep it only in deployment secrets.

## Gmail OTP setup

1. Use a dedicated Gmail sender account where possible.
2. Enable Google 2-Step Verification.
3. Generate an App Password for the backend mailer.
4. Set `GMAIL_USER` and `EMAIL_FROM` to the sender Gmail address.
5. Set `GMAIL_APP_PASSWORD` to the App Password, not the account password.
6. Generate a strong independent `EMAIL_OTP_SECRET`.

In production, Gmail and OTP secrets are validated at startup. Gmail SMTP is suitable for project/demo volume; a transactional email provider can later replace the mailer without changing the OTP domain logic.


## System Admin seed

Run the seed from the `server` directory:

```bash
npm run prisma:seed
```

In non-production environments, when `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` are not set, the seed creates/refreshes this development
account:

- Username: `system.admin`
- Email: `admin@quantumcrew.local`
- Password: `QuantumAdmin@123`
- Phone: `9000000001`

The development fallback is disabled when `NODE_ENV=production`. Production
seeding requires explicit `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` values.

Re-running the seed updates the seeded admin password hash from the currently
configured `SEED_ADMIN_PASSWORD`, which makes credential rotation predictable
instead of preserving an old seed password forever.

## Blockchain credential environment

```env
BLOCKCHAIN_ENABLED=false
BLOCKCHAIN_GATEWAY_URL=http://127.0.0.1:4100
BLOCKCHAIN_GATEWAY_KEY=dev-chain-gateway-key-change-me
BLOCKCHAIN_CONTRACT_VERSION=1
BLOCKCHAIN_WORKER_INTERVAL_MS=5000
BLOCKCHAIN_MAX_ATTEMPTS=5
QR_TOKEN_SECRET=dev-qr-token-secret-change-me
PUBLIC_APP_URL=http://localhost:5173
```

`BLOCKCHAIN_GATEWAY_KEY` must match `GATEWAY_API_KEY` in `blockchain/.env`. The EVM private key is deliberately absent from `server/.env`.
