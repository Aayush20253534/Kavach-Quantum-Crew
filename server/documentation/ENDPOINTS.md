# REST Endpoint Catalogue

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

All application routes are mounted under `API_PREFIX`, normally `/api/v1`.

Primary route groups include:

`/auth`, `/tourists`, `/trips`, `/groups`, `/tracking`, `/check-ins`, `/consents`, `/credentials`, `/safety`, `/signal-loss-cases`, `/alerts`, `/sos`, `/incidents`, `/disaster-management`, `/notifications`, `/notification-deliveries`, `/escalations`, `/hazards`, `/risk-zones`, `/monitoring`, `/dispatch`, `/emergency-services`, `/evidence`, `/admin`, `/analytics`, `/chatbot`, `/dashboard`, `/destinations`, `/integrations`, `/audit`, `/observability`.

Trip planning routes:
- `POST /trips/ai-plan` — proxy generation request to FastAPI
- `POST /trips/:tripId/ai-plan` — attach plan to owned `PLANNED` trip
- `POST /trips/:tripId/start` — activate trip after required consents

Group lock route:
- `POST /groups/:groupId/lock`

Use `server/openapi.yaml` and `src/modules/*/*.routes.js` for the exact request/response contract.
