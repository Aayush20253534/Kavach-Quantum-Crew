# Frontend Memory

## 1. Project State & Structure
The frontend is a React + Vite application structured using a feature-based architecture.

**Important Folders:**
- `src/app/`: Application core, containing `App.jsx`, `router.jsx`, `providers.jsx`, route `guards/`, and shared `layouts/`.
- `src/components/ui/`: Reusable UI elements (`Button`, `Input`, `Card`, `Badge`, `Modal`, `Loader`, `EmptyState`).
- `src/features/`: Domain-specific modules (`auth`, `onboarding`, `tourist`, `authority`, `trips`, `groups`, `incidents`, `sos`, `profile`, `public`).
- `src/services/`: API clients (`apiClient.js` for Axios, `queryClient.js` for TanStack Query).
- `src/store/`: Redux store configuration.
- `src/lib/`: Shared utilities (e.g., `utils.js` with `cn()` for Tailwind class merging).
- `docs/`: Critical project documentation (`Rules.md`, `Phases.md`, `Design.md`, `Architecture.md`, `PRD.md`).

## 2. Technologies & Libraries
- **Core:** React (v19), Vite (v8)
- **Styling:** Tailwind CSS (v4), `clsx`, `tailwind-merge`, `lucide-react`
- **Routing:** React Router DOM (v7)
- **State Management:** Redux Toolkit (global UI/Auth state), TanStack React Query (server state)
- **API & Forms:** Axios, React Hook Form, Zod

## 3. Implemented Features & Architecture
- **Routing & Guards:** Comprehensive route protection is in place.
  - `AuthInitializer`: Blocks rendering until the authentication session is verified.
  - `PublicRoute`: Diverts authenticated users to their respective dashboards.
  - `ProtectedRoute`: Ensures only authenticated users can access the content.
  - `RoleRoute`: Enforces role-based access (`TOURIST` vs `AUTHORITY`).
  - `OnboardingRoute`: Enforces the safety onboarding flow specifically for tourists.
- **Layouts:** `PublicLayout`, `AuthLayout`, `TouristLayout`, and `AuthorityLayout` shells are created.
- **Placeholders:** Every major route specified in the product plan has a dedicated placeholder page component (e.g., `TouristDashboardPage`, `CreateTripPage`, `JoinGroupPage`).
- **UI Components:** Foundational generic components (Button, Input, Card, Modal, Loader, Badge, EmptyState) exist.
- **API & Store Setup:** `apiClient` with Axios interceptors and a global Redux store (`store/index.js`) integrated with `Providers`.

## 4. Authentication & State Management
- **Redux Auth Slice (`src/features/auth/store/authSlice.js`):**
  - Manages global session state with `{ user: { id, name, role, onboardingComplete }, isAuthenticated, initialized }`.
  - Actions `setAuth`, `setInitialized`, `logout` are configured.

## 5. API Integrations
- **No live endpoints** are currently integrated. The `apiClient.js` is configured with interceptors and a base URL reading from `import.meta.env.VITE_API_URL`, but all components currently render placeholder text.

## 6. Architectural Decisions
- **Feature Isolation:** Pages, API calls, and logic belong to specific features rather than global folders.
- **Route Authorization vs Authentication:** Split into `ProtectedRoute` and `RoleRoute` to strictly enforce separation of concerns.
- **Global SOS vs UI State:** Decided to defer creating a complex global Redux slice for SOS until backend contracts are established; SOS will likely rely on server state.
- **State Segregation:** Redux strictly handles client/auth state, while TanStack Query will manage all backend data fetching and caching.

## 7. Current Phase & Progress
**Current Phase:** Phase 1 — Design System and Application Shell 
**Status:** In Progress

- **Phase 0 — Foundation Verification:** Completed.
- **Phase 1 — Design System and Application Shell:** Partially completed. The structural layout and reusable components are scaffolded, awaiting final UI/UX designs from the designer (Prachi).
- **Phases 2-11:** Not Started.

## 8. Incomplete Work, Bugs, Blockers, & TODOs
- **Blocker:** Waiting on UI/UX mockups from the design team to replace the placeholder pages and refine the shared layouts (`TouristLayout`, `AuthorityLayout`, etc.).
- **Blocker:** Waiting on Backend API contracts and endpoint documentation to integrate actual requests into `apiClient`, Auth hooks, and TanStack queries.
- **TODO:** Implement the `AuthInitializer` API call to restore sessions on refresh (currently left as a commented-out stub).

## 9. Important Files to Inspect
- `frontend/src/app/router.jsx` (Central routing hub)
- `frontend/src/app/guards/*` (All authorization logic)
- `frontend/src/features/auth/store/authSlice.js` (Auth state structure)
- `frontend/docs/Rules.md` & `frontend/docs/Phases.md` (Strict operational guidelines)

## 10. Next Recommended Step
Integrate the actual UI/UX designs for the **Application Shell** (Navbars/Sidebars in `layouts/`) and the **Public Landing Page** once provided, or begin wiring up the **Authentication Flow** (Phase 2) if backend API endpoints become available first. Do not invent new features or UI without explicit design guidelines.
