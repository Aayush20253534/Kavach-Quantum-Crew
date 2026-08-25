# Frontend Project State

> **Documentation status (24 Aug 2026):** Current snapshot summary. Source code remains authoritative.

## Current implementation

The frontend is no longer a placeholder shell. It has working feature modules and role-specific pages for authentication, onboarding, tourist trips/groups/tracking/incidents/profile, authority incident and dispatch operations, risk/hazard/responder management, analytics, and system-admin pages.

Core stack: React 19, Vite 8, React Router 7, Redux Toolkit, TanStack Query, Axios, React Hook Form/Zod, Tailwind CSS 4, Leaflet/Google Maps support, QR scanning/rendering, and Lucide icons.

## Runtime boundaries

- `src/app/router.jsx` is the route source of truth.
- `src/services/apiClient.js` is the shared HTTP transport boundary.
- feature API wrappers live in `src/features/*/api/`.
- Redux owns auth/client state; TanStack Query owns server state.
- backend business rules must not be duplicated in the browser.
- QR validity and blockchain state are server-controlled.

## Known integration gap

`src/components/chatbot/ChatbotWidget.jsx` still simulates an AI reply locally. The backend does expose `POST /api/v1/chatbot/messages`, but its default provider is intentionally unconfigured and returns `501 CHATBOT_PROVIDER_NOT_CONFIGURED` until a real provider is supplied. Wiring the widget to that endpoint is outstanding.

## QR implementation

Group and individual credentials are displayed in dedicated large QR sections. Group QR scans go through preview → join request → leader approval. They are not an automatic membership mechanism.

## Next maintenance rule

When frontend behavior changes, update `frontend/README.md`, `docs/Architecture.md`, and `docs/ENDPOINTS.md` before relying on historical phase/team notes.
