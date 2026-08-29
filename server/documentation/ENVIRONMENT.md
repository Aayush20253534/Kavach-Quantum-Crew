# Environment Configuration Reference

> Synchronized with `server/src/config/environment.js` and `server/.env.example` on **29 August 2026**. Production should use platform secret storage; never commit a populated `.env`.

## Application/runtime

| Variable | Purpose | Typical local value |
|---|---|---|
| `NODE_ENV` | runtime mode | `development` |
| `APP_NAME` | service name in logs/responses | `smart-tourist-safety-backend` |
| `APP_VERSION` | reported service version | `0.1.0` |
| `HOST` | bind address | `0.0.0.0` |
| `PORT` | HTTP port | `4000` |
| `API_PREFIX` | versioned API prefix | `/api/v1` |
| `LOG_LEVEL` | Pino verbosity | `info` |
| `SHUTDOWN_TIMEOUT_MS` | graceful shutdown deadline | `10000` |
| `TRUST_PROXY` | honor reverse-proxy forwarding | `false` local, `true` on Render |

## Database

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string consumed by Prisma/pg adapter |
| `DATABASE_POOL_MAX` | pool upper bound |
| `DATABASE_CONNECTION_TIMEOUT_MS` | connection timeout |

## HTTP, CORS, rate limiting, and request safety

| Variable | Purpose |
|---|---|
| `CORS_ORIGINS` | comma-separated browser origins |
| `CORS_CREDENTIALS` | whether credentialed cross-origin requests are allowed |
| `SOCKET_IO_ENABLED` | enables Socket.IO server |
| `JSON_BODY_LIMIT` | Express parser body limit |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | general API limiter |
| `SENSITIVE_RATE_LIMIT_WINDOW_MS` / `SENSITIVE_RATE_LIMIT_MAX` | stricter sensitive-action limiter |
| `SECURITY_MAX_OBJECT_DEPTH` | nested object abuse guard |
| `SECURITY_MAX_OBJECT_KEYS` | request object key-count guard |

Rate limiting is implemented in the Express app. There is no repository Nginx API-gateway layer.

## Redis / Upstash

| Variable | Default | Use |
|---|---:|---|
| `REDIS_ENABLED` | `false` | master cache switch |
| `UPSTASH_REDIS_REST_URL` | empty | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | empty | server-side token |
| `REDIS_KEY_PREFIX` | `sts` | namespace all keys |
| `REDIS_DASHBOARD_TTL_SECONDS` | `30` | dashboard aggregate TTL |
| `REDIS_DESTINATIONS_TTL_SECONDS` | `900` | destination catalogue TTL |
| `REDIS_RISK_ZONES_TTL_SECONDS` | `30` | safety/risk reference TTL |
| `REDIS_PLACES_TTL_SECONDS` | `21600` | Google Places jurisdiction TTL |
| `REDIS_ANALYTICS_TTL_SECONDS` | `20` | analytics aggregate TTL |

Redis is fail-open and must not become a correctness dependency. Live GPS, dispatch state, group joins, notifications, and other Socket.IO-driven state are intentionally not generic cached responses.

## Authentication/session

| Variable | Purpose |
|---|---|
| `ACCESS_TOKEN_SECRET` | JWT access signing secret |
| `REFRESH_TOKEN_SECRET` | refresh-token secret |
| `ACCESS_TOKEN_TTL` | access JWT TTL |
| `REFRESH_TOKEN_TTL_DAYS` | persisted refresh-session lifetime |
| `JWT_ISSUER` | JWT issuer validation |
| `JWT_AUDIENCE` | JWT audience validation |
| `REFRESH_COOKIE_NAME` | cookie key |
| `REFRESH_COOKIE_SECURE` | Secure attribute |
| `REFRESH_COOKIE_SAME_SITE` | SameSite policy |

For Vercel → Render production, the repository comments recommend secure cross-site cookie settings (`Secure=true`, `SameSite=None`) when the frontend/backend are on different sites.

## Mailjet and OTP

| Variable | Purpose |
|---|---|
| `MAILJET_API_KEY` | Mailjet public/API key used in Basic Auth |
| `MAILJET_SECRET_KEY` | Mailjet secret key |
| `MAILJET_SENDER_EMAIL` | verified sender address |
| `MAILJET_SENDER_NAME` | display name |
| `EMAIL_OTP_SECRET` | server secret used by OTP protection logic |
| `EMAIL_OTP_TTL_MINUTES` | verification/reset code lifetime |
| `EMAIL_OTP_RESEND_COOLDOWN_SECONDS` | resend throttle |
| `EMAIL_OTP_MAX_ATTEMPTS` | incorrect-attempt ceiling |

Mailjet calls are made server-side with built-in `fetch` through `mailjet.client.js`. The configured sender must be verified in Mailjet.

## Incident escalation

- `INCIDENT_ACK_TIMEOUT_MINUTES`
- `INCIDENT_ESCALATION_INTERVAL_MINUTES`

These control acknowledgement/escalation timing used by the incident monitoring/escalation logic.

## Evidence and profile files

| Variable | Purpose |
|---|---|
| `EVIDENCE_MAX_FILE_BYTES` | evidence upload limit |
| `EVIDENCE_STORAGE_DIR` | local/storage-adapter directory where applicable |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary profile-image integration |
| `PROFILE_IMAGE_MAX_FILE_BYTES` | profile image limit |
| `MEDICAL_DOCUMENT_MAX_FILE_BYTES` | medical document limit |

## Google integration

`GOOGLE_MAPS_API_KEY` is a server-side key used for jurisdiction Places searches and mapping helpers. Browser Maps keys, if separately used by the client, must have browser/referrer restrictions and are not interchangeable with unrestricted server secrets.

## AI services

| Variable | Purpose |
|---|---|
| `AI_SERVICE_URL` | Rakshak AI service base URL |
| `TRIP_PLANNER_SERVICE_URL` | FastAPI trip-planner base URL |
| `AI_TRIP_PLAN_TIMEOUT_MS` | Node → FastAPI request timeout (default currently 120000 ms) |

Production must not leave `TRIP_PLANNER_SERVICE_URL` on `127.0.0.1` when FastAPI is deployed as a separate service.

## Blockchain integration

| Variable | Purpose |
|---|---|
| `BLOCKCHAIN_ENABLED` | enable proof/anchor integration |
| `BLOCKCHAIN_GATEWAY_URL` | isolated signing gateway URL |
| `BLOCKCHAIN_GATEWAY_KEY` | shared API key between main backend and gateway |
| `BLOCKCHAIN_DATA_ENCRYPTION_KEY` | application-side encryption key for permitted payloads |
| `BLOCKCHAIN_CONTRACT_VERSION` | numeric contract version supplied to issue operation |
| `BLOCKCHAIN_WORKER_INTERVAL_MS` | anchor worker cadence |
| `BLOCKCHAIN_MAX_ATTEMPTS` | retry ceiling |
| `QR_TOKEN_SECRET` | signed QR/token secret |
| `PUBLIC_APP_URL` | frontend base for QR verification/deep links |

Never put `ISSUER_PRIVATE_KEY`, chain RPC signing secrets, or contract signer credentials in the main `server/.env`. Those belong to the isolated `blockchain/` service.

## Seed accounts

The `.env.example` exposes optional `SEED_ADMIN_*` and `SEED_DM_*` variables. Development has documented fallback credentials, but production must explicitly configure non-demo values or avoid relying on demo seeds.

## Production checklist

- Use strong random JWT, refresh, OTP, QR, blockchain gateway, and encryption secrets.
- Configure the real PostgreSQL URL and run `prisma migrate deploy`.
- Verify Mailjet sender email before testing OTP/dispatch emails.
- Enable Redis only with valid Upstash URL/token.
- Set `TRUST_PROXY=true` behind Render/reverse proxies.
- Set CORS to the deployed frontend origin, not `*` with credentials.
- Point AI URLs to actual deployed services.
- Keep every provider secret out of `VITE_*`.
- Run `npm run env:check` before deployment.
