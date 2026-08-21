# Frontend Memory

## 1. Project State & Structure
The frontend is a modern, high-aesthetic React + Vite application structured using a feature-based architecture following `Design.md` and `Architecture.md`.

**Core Folders:**
- `src/app/`: Application core, containing `App.jsx`, `router.jsx`, `providers.jsx`, route `guards/`, and shared `layouts/` (`PublicLayout`, `AuthLayout`, `TouristLayout`, `AuthorityLayout`).
- `src/components/ui/`: Reusable UI elements (`Button`, `SOSButton`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Modal`, `Loader`, `EmptyState`).
- `src/components/chatbot/`: Floating `ChatbotWidget.jsx` (Rakshak AI Safety Companion).
- `src/features/`: Domain-specific modules (`auth`, `onboarding`, `tourist`, `authority`, `trips`, `groups`, `incidents`, `profile`, `public`).
- `src/services/`: API clients (`apiClient.js` for Axios, `queryClient.js` for TanStack Query).
- `src/store/`: Redux store configuration.
- `src/lib/`: Shared utilities (`utils.js` with `cn()`).
- `src/styles/`: Global dark theme tokens, glowing border utilities, radar sweep animations in `globals.css`.
- `docs/`: Project documentation (`Rules.md`, `Phases.md`, `Design.md`, `Architecture.md`, `PRD.md`, `Prachi.md`).

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

## 4. Current Phase & Progress
**Current Phase:** Phase 1-4 & Core Feature UI Design Complete
**Status:** Completed & Verified against Vite build (`npm run build` passed in 4.05s).

## 5. Next Recommended Step
Proceed to connect live backend REST endpoints / WebSockets for live SOS dispatching and database integration when backend contracts are ready.
