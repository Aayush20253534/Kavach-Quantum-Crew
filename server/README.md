# Smart Tourist Safety System — Backend

Phase 0 provides the production-shaped foundation for the SIH prototype. It is a Node.js
ESM service built with Express, PostgreSQL, Prisma, Socket.IO, Pino, Jest, and Supertest.

This phase intentionally contains no authentication or tourist/disaster-management/admin
business flows yet. AI and blockchain also remain separate services and are not part of
this backend.

## What Phase 0 includes

- Validated environment configuration with clear fail-fast startup errors
- PostgreSQL connection lifecycle through Prisma 7 and `@prisma/adapter-pg`
- Express app separated from the HTTP server for easy testing
- Helmet, explicit CORS allow-listing, request size limits, rate limiting, and request IDs
- Structured JSON application and request logging with secret redaction
- Standard success/error envelopes plus centralized 404 and error handling
- Liveness, readiness, and database health probes
- Socket.IO server bootstrap with no sensitive business events enabled yet
- Graceful shutdown for HTTP, Socket.IO, and PostgreSQL
- Jest/Supertest Phase 0 tests, ESLint, Docker, and local PostgreSQL Compose files

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- PostgreSQL 15+ (or Docker Desktop)

## First run (PowerShell)

```powershell
Copy-Item .env.example .env
npm install
npm run prisma:generate
npm run prisma:validate
npm test
npm run dev
```

## First run (bash)

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:validate
npm test
npm run dev
```

The API listens at `http://localhost:4000` by default. A database must be reachable before
the server starts. To start the provided local database:

```bash
docker compose up -d postgres
```

## Health endpoints

| Endpoint               | Purpose                                     | Healthy status |
| ---------------------- | ------------------------------------------- | -------------- |
| `GET /health`          | Process liveness; does not touch PostgreSQL | `200`          |
| `GET /health/ready`    | Whether required dependencies are ready     | `200` or `503` |
| `GET /health/database` | Direct PostgreSQL probe and latency         | `200` or `503` |
| `GET /api/v1/health/*` | API-prefixed aliases of the same probes     | Same as above  |

All JSON responses include `success`, `requestId`, and `timestamp`. Send an
`X-Request-ID` header to correlate frontend and backend logs; unsafe values are replaced.

## Useful commands

| Command                      | What it does                                        |
| ---------------------------- | --------------------------------------------------- |
| `npm run env:check`          | Validates configuration without starting the server |
| `npm run env:check:database` | Also opens and probes PostgreSQL                    |
| `npm run dev`                | Starts with automatic reload                        |
| `npm start`                  | Starts normally                                     |
| `npm test`                   | Runs the Phase 0 test suite                         |
| `npm run test:coverage`      | Runs tests and enforces coverage thresholds         |
| `npm run lint`               | Checks JavaScript quality rules                     |
| `npm run format:check`       | Checks Prettier formatting                          |
| `npm run prisma:generate`    | Generates Prisma Client                             |
| `npm run prisma:validate`    | Validates Prisma configuration/schema               |

## Environment safety

Commit example files only. Never commit `.env`, database credentials, tokens, service
accounts, private keys, or uploaded evidence. In production, use explicit HTTPS origins;
wildcard CORS is rejected when credentials are enabled and is always rejected in production.

## Phase 1 - Tourist authentication and onboarding

Phase 1 adds the permanent tourist account and onboarding/profile foundation required before trips, groups, tracking, SOS, and incidents. Tourist profile fields are stored directly on `users`; privileged staff accounts are stored separately in `disaster_managers` and `system_admins`.

### Implemented API

- `POST /api/v1/auth/register` - tourist signup with name, username, email, phone, password, and confirm password.
- `POST /api/v1/auth/login` - sign in using username or email plus password.
- `POST /api/v1/auth/refresh` - rotate the refresh token and return a new access token.
- `POST /api/v1/auth/logout` - revoke the current refresh session.
- `GET /api/v1/auth/me` - return the authenticated permanent account.
- `POST /api/v1/tourists/me/onboarding` - save gender, age, medical history, emergency phone, and nationality.
- `GET /api/v1/tourists/me` - return the tourist profile used by the Profile screen.
- `PATCH /api/v1/tourists/me` - update supported profile fields.

Access tokens expire after 15 minutes. Refresh tokens expire after 15 days, are rotated on refresh, stored only as SHA-256 hashes in PostgreSQL, and are also issued as HttpOnly cookies. Passwords use Argon2id. Tourist self-registration cannot create privileged staff accounts.

### Database migration

After setting `DATABASE_URL` and `DIRECT_URL` for Neon:

```powershell
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate
```

For a deployed environment, apply already-created migrations with:

```powershell
npm run prisma:migrate:deploy
```

### Optional staff seed accounts

`SYSTEM_ADMIN` and `DISASTER_MANAGER` are authenticated from their own database tables, separate from tourist `users`. Set the optional `SEED_ADMIN_*` and `SEED_DM_*` variables in `.env`, then run `npm run prisma:seed`. If email/password values are left blank, that staff account is not created.

### Not part of Phase 1

Tourist dashboard live location, nearby safe zones, risk scoring, SOS/incident workflow, trip history, trip creation, group QR join/create, tracking, chatbot, and responder dispatch remain later phases. Their module placeholders stay untouched so Phase 1 does not pretend the emergency system exists before its foundations do.
