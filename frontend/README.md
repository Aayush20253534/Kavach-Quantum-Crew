# KAVACH Frontend

React 19 + Vite client for the KAVACH Smart Tourist Safety Network. It contains separate experiences for tourists, disaster-management authorities, and system administrators.

> **Verified:** 24 August 2026. This README describes the current `frontend/src` tree rather than the original Vite scaffold or historical phase plan.

## Stack

- React 19
- Vite 8
- React Router 7
- Redux Toolkit for authentication/client state
- TanStack Query for server state
- Axios
- React Hook Form + Zod
- Tailwind CSS 4
- Leaflet / React Leaflet and Google Maps support
- Socket-capable backend architecture (realtime behavior is primarily backend-driven)
- `html5-qrcode` for QR scanning and `qrcode.react` for QR rendering

## Application routes

Public:
- `/`
- `/verify/:token`
- `/auth/login`
- `/auth/register`
- `/auth/verify-email`

Tourist:
- `/tourist/onboarding`
- `/tourist/dashboard`
- `/tourist/tracking`
- `/tourist/trips/create`
- `/tourist/trips/current`
- `/tourist/trips/history`
- `/tourist/groups/create`
- `/tourist/groups/join`
- `/tourist/incidents/report`
- `/tourist/incidents/history`
- `/tourist/checkins`
- `/tourist/profile`

Authority:
- `/authority/dashboard`
- `/authority/incidents`
- `/authority/incidents/:id`
- `/authority/hazards`
- `/authority/dispatch`
- `/authority/zones`
- `/authority/responders`
- `/authority/analytics`

Admin:
- `/admin/dashboard`
- `/admin/locations`
- `/admin/zones`
- `/admin/accounts`
- `/admin/audit`

Routes are protected by authentication, role, and tourist-onboarding guards in `src/app/guards/`.

## QR credential UX

The trip page renders dedicated large QR areas rather than duplicating tiny QR images inside summary cards:

- group credential QR: used to identify an active group for join preview/request
- individual credential QR: used for individual trip credential verification

A scanned group QR does not directly create membership. The frontend previews the group, sends a join request, and waits for the leader approval flow implemented by the backend.

The public `/verify/:token` screen verifies signed credential links through the backend and reflects database/blockchain lifecycle state.

## Source layout

```text
src/
├── app/                 router, layouts, providers, guards
├── components/          shared UI + chatbot widget
├── features/            domain pages, services, queries
│   ├── admin/
│   ├── auth/
│   ├── authority/
│   ├── credentials/
│   ├── dashboard/
│   ├── destinations/
│   ├── groups/
│   ├── incidents/
│   ├── notifications/
│   ├── onboarding/
│   ├── profile/
│   ├── safety/
│   ├── tourist/
│   ├── tracking/
│   └── trips/
├── services/            Axios + TanStack Query setup
├── store/               Redux store
└── lib/                 shared utilities
```

## Environment

Create `.env` from `.env.example`:

```dotenv
VITE_API_URL=http://localhost:4000/api/v1
VITE_PUBLIC_APP_URL=http://localhost:5173
```

`VITE_*` values are embedded into browser assets. Never put access-token secrets, gateway keys, RPC credentials, or blockchain private keys here.

## Development

```bash
npm ci
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## API ownership

Feature API wrappers live under `src/features/*/api/`. Shared transport behavior belongs in `src/services/apiClient.js`; server state caching belongs in TanStack Query; authentication/client state belongs in Redux.

Do not duplicate backend business rules in the UI. The backend remains authoritative for authorization, trip lifecycle, group membership, QR validity, chain status, incident state, and safety decisions.

## Chatbot status

The backend exposes `POST /api/v1/chatbot/messages` for authenticated tourists, but the default backend chatbot provider is unconfigured and returns `501` until a concrete provider is injected. The current `ChatbotWidget.jsx` still uses a temporary simulated local response, so frontend wiring to that API is unfinished.

## Documentation

- `docs/Architecture.md` — frontend structure and data-flow decisions
- `docs/Design.md` — visual/design system guidance
- `docs/ENDPOINTS.md` — frontend-facing API catalogue
- `docs/PRD.md` — product requirements and historical scope
- `docs/Phases.md` — implementation history/plan
- `docs/Rules.md` — contribution constraints
- `docs/Memory.md` and `Memory.md` — project-state notes; source code wins when stale
