# Frontend Memory

## 1. Project State & Structure
The frontend is a React + Vite application structured using a feature-based architecture.

**Important Folders:**
- `src/app/`: Application core, containing `App.jsx`, `router.jsx`, `providers.jsx`, route `guards/`, and shared `layouts/`.
- `src/components/ui/`: Reusable UI elements (`Button`, `Input`, `Card`, `Badge`, `Modal`, `Loader`, `EmptyState`).
- `src/features/`: Domain-specific modules (`auth`, `onboarding`, `tourist`, `authority`, `trips`, `groups`, `incidents`, `sos`, `profile`, `public`, and upcoming `tracking`/`realtime`).
- `src/services/`: API clients (`apiClient.js` for Axios, `queryClient.js` for TanStack Query).
- `src/store/`: Redux store configuration.
- `src/lib/`: Shared utilities (e.g., `utils.js` with `cn()` for Tailwind class merging).
- `docs/`: Critical project documentation (`Rules.md`, `Phases.md`, `Design.md`, `Architecture.md`, `PRD.md`, `Prachi.md`, `Aayansh.md`).

## 2. Technologies & Libraries
- **Core:** React (v19), Vite (v8)
- **Styling:** Tailwind CSS (v4), `clsx`, `tailwind-merge`, `lucide-react`
- **Routing:** React Router DOM (v7)
- **State Management:** Redux Toolkit (global UI/Auth state), TanStack React Query (server state)
- **API & Forms:** Axios, React Hook Form, Zod

## 3. Current Phase & Progress
**Current Phase:** Phase 1 — Design System and Application Shell 
**Status:** In Progress (Documentation updated for incoming Phase 2 and 3.5 integrations).

- **Backend Availability:** The backend basic flow, SMTP-based OTP email verification, and functional HTTP geofencing (`/api/v1/risk-zones`) are now fully available and documented in `ENDPOINTS.md`.
- **Frontend Work Remaining:** The frontend must still integrate OTP verification, OpenStreetMap map rendering, browser GPS tracking, and geofence visualization.

## 4. New Technical Decisions
- **Map Strategy:** Implement map purely as a presentational layer using OpenStreetMap, keeping it decoupled from GPS lifecycle logic so it can be swapped to Google Maps if needed.
- **GPS Architecture:** Centralize browser geolocation (`watchPosition`) into a dedicated tracking feature independent of the UI map components.
- **Geofence Authority:** The frontend will visualize geofences fetched from the backend, but the **backend is the absolute authority** on safety decisions. The frontend will not run local overlap algorithms to trigger critical alerts.
- **Socket.IO Architecture:** Integrate `socket.io-client` with authenticated handshakes.
- **Server-State Synchronization:** Real-time Socket.IO events will directly update/invalidate TanStack Query caches rather than duplicating data into Redux.

## 5. Known Blockers
- **Socket.IO Contracts Missing:** The backend's `socketServer.js` currently indicates "Phase 0 exposes no location or incident events." Thus, exact Socket.IO event names, room contracts, payload schemas, and authentication handshake requirements remain unknown and blocked.
- **UI/UX Blocked:** Prachi's design handoffs for the application shell, OTP screens, and Map UI states are still pending.

## 6. Next Recommended Step
The exact next implementation task is:
**Step 0 & 1 of `Aayansh.md`** — Inspect existing Auth slices and implement the OTP Authentication Flow (`/api/v1/auth/register` and `/api/v1/auth/verify-email`) using the newly available backend endpoints. Visual integration waits for Prachi, but technical state integration can begin immediately.
