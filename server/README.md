# KAVACH Main Backend

`server/` is the authoritative application API for KAVACH. It is an Express 5 service backed by Prisma/PostgreSQL and Socket.IO. It owns authentication, trips, groups, safety state, incidents, notifications, emergency dispatch, provider integrations and scheduled jobs.

## Run locally

```bash
cp .env.example .env
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Default API base: `http://localhost:4000/api/v1`.

## Major subsystems

- authentication, OTP verification and refresh sessions
- tourist profiles and credentials
- trips, group membership and group locking
- AI trip-plan proxy + stored trip plans
- live tracking, geofences, alerts, SOS and signal-loss workflows
- incidents, hazards, risk zones and Disaster Management operations
- Police / Fire / Ambulance provisioning, dispatch and live responder GPS
- realtime Socket.IO events and scheduled jobs
- Mailjet transactional email
- Cloudinary uploads, Google Places/Maps integration and optional Upstash Redis cache
- authenticated blockchain gateway integration

## Trip planning rules

Planning is only available before a trip starts. `POST /trips/:tripId/ai-plan` rejects non-`PLANNED` trips. The client starts the trip immediately after either choosing manual planning or saving an AI plan. Group AI generation is leader-only; members read the stored `aiPlan` from current-trip state.

## Mailjet

The backend calls Mailjet Send API v3.1 through `src/integrations/notifications/mailjet.client.js`.

```env
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_SENDER_EMAIL=verified-sender@example.com
MAILJET_SENDER_NAME=QuantumCrew
```

## External services

```text
client ──REST/Socket.IO──► server
server ──HTTP────────────► FastAPI trip planner
server ──HTTP────────────► blockchain gateway
server ──HTTP────────────► Mailjet / Maps / Cloudinary / Upstash
Rakshak AI ──authenticated REST──► server
```

## Commands

```bash
npm run env:check
npm run prisma:validate
npm run lint
npm test
npm run dev
npm start
```

See `documentation/` for subsystem-specific notes and `openapi.yaml` plus route files for the exact API contract.
