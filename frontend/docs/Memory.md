# Frontend Memory

## 1. Project State & Structure
The frontend is a modern, high-aesthetic React + Vite application structured using a feature-based architecture following `Design.md` and `Architecture.md`.

**Core Folders:**
- `src/app/`: Application core, containing `App.jsx`, `router.jsx`, `providers.jsx`, route `guards/`, and shared `layouts/` (`PublicLayout`, `AuthLayout`, `TouristLayout`, `AuthorityLayout`).
- `src/components/ui/`: Reusable UI elements (`Button`, `SOSButton`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Modal`, `Loader`, `EmptyState`).
- `src/components/chatbot/`: Floating `ChatbotWidget.jsx` (Rakshak AI Safety Companion).
- `src/features/`: Domain-specific modules (`auth`, `onboarding`, `tourist`, `authority`, `trips`, `groups`, `incidents`, `sos`, `profile`, `public`, and upcoming `tracking`/`realtime`).
- `src/services/`: API clients (`apiClient.js` for Axios, `queryClient.js` for TanStack Query).
- `src/store/`: Redux store configuration.
- `src/lib/`: Shared utilities (`utils.js` with `cn()`).
- `src/styles/`: Global dark theme tokens, glowing border utilities, radar sweep animations in `globals.css`.
- `docs/`: Project documentation (`Rules.md`, `Phases.md`, `Design.md`, `Architecture.md`, `PRD.md`, `Prachi.md`, `Aayansh.md`).

## 2. Technologies & Libraries
- **Core:** React (v19), Vite (v8)
- **Styling:** Tailwind CSS (v4), `clsx`, `tailwind-merge`, `lucide-react`
- **Routing:** React Router DOM (v7)
- **State Management:** Redux Toolkit (global UI/Auth/Session state), TanStack React Query (server state)
- **API & Forms:** Axios, React Hook Form, Zod

## 3. Implemented Features & Architecture
- **Design System**: Deep navy theme (`#060B16` / `#0D1526` / `#111C30`), electric cyan/blue accents, pulsing emergency SOS triggers, glowing semantic risk badges, glassmorphism cards, and sleek scrollbars.
- **Routing & Guards**: Comprehensive route protection and initialization in `router.jsx` and `guards/*`.
- **Layouts**:
  - `PublicLayout`: Emergency ribbon, glass navbar, CTAs, and safety hotlines footer.
  - `AuthLayout`: Security backdrop with back navigation.
  - `TouristLayout`: Mobile bottom navigation + Desktop sidebar with quick SOS and status pill.
  - `AuthorityLayout`: High-density command center layout with alert ticker.
- **Phase 1 & 2 Pages**:
  - `HomePage`: Hero section with animated radar visualizer, live protection stats, Prayagraj Safe Zones preview, features grid, emergency hotlines, and call-to-action.
  - `LoginPage`: Multi-role login (Tourist, Authority, Admin) with role tabs, password toggle, and validation.
  - `RegisterPage`: Full registration with password strength meter and terms acceptance.
- **Phase 3 & 4 Pages**:
  - `OnboardingPage`: 4-step wizard collecting Personal Details, Emergency Contact, Medical Info, and Safety & Privacy Permissions.
  - `TouristDashboardPage`: Dual-state command center supporting **State A (No Active Trip)** and **State B (Active Trip)** with an interactive state switch toolbar.
- **Trips, Groups, Incidents & Profile**:
  - `CreateTripPage`, `CurrentTripPage`, `TripHistoryPage`.
  - `CreateGroupPage` (Dynamic QR generation & shareable link) and `JoinGroupPage` (Camera viewfinder simulator & manual code).
  - `ReportIncidentPage` and `IncidentHistoryPage`.
  - `ProfilePage` (Digital Tourist Safety ID Card).
  - `AuthorityDashboardPage` (Live SOS triage feed, crowd density monitor, mass broadcast alert modal).
  - `ChatbotWidget` (Rakshak AI 24/7 Safety Assistant).

### Current Phase Status
- **Phase 1 (Authentication):** Completed & Wired (Redux + Axios Interceptors)
- **Phase 2 (Onboarding):** Completed & Wired
- **Phase 3 (Trips & Groups):** Completed & Wired (TanStack React Query)
- **Phase 4 (Maps & Tracking):** Completed & Wired (React-Leaflet, Background GPS)
- **Phase 5 (SOS & Incidents):** Completed & Wired (Multipart evidence upload, Dispatch)
- **Phase 6 (Authority Command Center):** Completed & Wired (Live feeds, Hazard resolution)

> **Overall Frontend Status:** The functional integration (Aayansh's responsibility) is **100% complete**. The UI is currently using basic Tailwind placeholders. The next step is for Prachi to design these functional components according to the `Design.md` aesthetics.

## 4. Current Phase & Progress
**Current Phase:** Core Feature UI Design Complete & API Integration Pending.
**Status:** In Progress. UI verified against Vite build. (Documentation updated for incoming Phase 2 and 3.5 integrations).

- **Backend Availability:** The backend basic flow, SMTP-based OTP email verification, and functional HTTP geofencing (`/api/v1/risk-zones`) are now fully available and documented in `ENDPOINTS.md`.
- **Frontend Work Remaining:** The frontend must now connect live backend REST endpoints / WebSockets. This includes integrating OTP verification, OpenStreetMap map rendering, browser GPS tracking, and geofence visualization.

## 5. New Technical Decisions
- **Map Strategy:** Implement map purely as a presentational layer using OpenStreetMap, keeping it decoupled from GPS lifecycle logic so it can be swapped to Google Maps if needed.
- **GPS Architecture:** Centralize browser geolocation (`watchPosition`) into a dedicated tracking feature independent of the UI map components.
- **Geofence Authority:** The frontend will visualize geofences fetched from the backend, but the **backend is the absolute authority** on safety decisions. The frontend will not run local overlap algorithms to trigger critical alerts.
- **Socket.IO Architecture:** Integrate `socket.io-client` with authenticated handshakes.
- **Server-State Synchronization:** Real-time Socket.IO events will directly update/invalidate TanStack Query caches rather than duplicating data into Redux.

## 6. Known Blockers
- **Socket.IO Contracts Missing:** The backend's `socketServer.js` currently indicates "Phase 0 exposes no location or incident events." Thus, exact Socket.IO event names, room contracts, payload schemas, and authentication handshake requirements remain unknown and blocked.

## 7. Next Recommended Step
The exact next implementation task is:
**Step 0 & 1 of `Aayansh.md`** — Inspect existing Auth slices and implement the OTP Authentication Flow (`/api/v1/auth/register` and `/api/v1/auth/verify-email`) using the newly available backend endpoints. After authentication is wired, proceed to connect live backend REST endpoints / WebSockets for live SOS dispatching and database integration when backend contracts are ready.
