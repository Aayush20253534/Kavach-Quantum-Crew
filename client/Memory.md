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

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## 2026-08-27 current frontend state

The frontend currently has four distinct authenticated shells: Tourist, Disaster Management, System Admin, and Emergency Responder. The latest visual direction is intentionally different for each operational role while preserving shared interaction rules.

- **System Admin:** neutral black/gray enterprise UI, white cards, consistent restrained radius, dark outer card borders, dense tables with row/column separators, two-column forms, white diagnostics, and compact dashboard metrics.
- **Disaster Management:** silvery/graphite emergency-operations shell with red emergency accents, split incident operations, balanced command map, fleet dispatch, response intelligence, and collapsible navigation that reflows content correctly.
- **Responder:** shared professional shell configured by role. Police uses blue accents, Ambulance uses green, and Fire uses red. Active Dispatch, Live Tracking, and Dispatch History use the same component architecture.
- **Tourist:** mobile-first safety experience with trip, group, incident, profile, SOS, notifications, and response-tracking flows.

Responder live tracking uses the fixed fleet-account coordinates as a blue base marker. After dispatch activation, browser GPS becomes the live route origin and the road route to the incident is drawn in black. User zoom/pan is not reset by recurring GPS updates.
