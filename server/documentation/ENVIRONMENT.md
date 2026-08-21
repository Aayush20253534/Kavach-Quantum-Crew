# Environment Configuration

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
| `SEED_ADMIN_*` | Optional System Admin seed |
| `SEED_DM_*` | Optional Disaster Manager seed |
| `INCIDENT_ACK_TIMEOUT_MINUTES` | Escalation acknowledgement threshold |
| `INCIDENT_ESCALATION_INTERVAL_MINUTES` | Repeat escalation interval |

Production rules:
- use separate strong access/refresh secrets,
- restrict CORS to deployed frontend origins,
- enable HTTPS,
- configure `TRUST_PROXY` to the real proxy topology,
- keep DB/provider/service-account secrets outside Git.
