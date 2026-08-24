# Frontend Architecture Document

> **Documentation status (24 Aug 2026):** Retained as project documentation and design history. Current `frontend/src/` behavior is authoritative where older phase language, placeholders, or proposed structure differs.


## 1. Purpose

This document defines the architecture of the **SIH Tourist Safety Platform frontend**.

It explains:

* The frontend technology stack
* Application structure
* Folder organization
* Routing architecture
* State management
* Server-state management
* API integration
* Authentication and onboarding flow
* Component organization
* Feature organization
* Error handling
* Data flow
* Development boundaries

This architecture applies **only to the frontend**.

---

# 2. Frontend Scope and Workspace Boundary

The workspace may contain multiple parts of the SIH project, including backend services, databases, infrastructure, and other applications.

The frontend agent must operate only inside:

```text
frontend/
```

The agent may inspect files outside the frontend directory when necessary to understand:

* Available APIs
* API contracts
* Shared project context
* Environment configuration requirements

However, the agent must **never create, modify, delete, rename, or move files outside the `frontend/` directory**.

The agent must not:

* Modify backend source code
* Modify database schemas
* Modify server configuration
* Modify infrastructure
* Modify files belonging to other applications

All implementation work must remain isolated inside:

```text
frontend/
```

---

# 3. Technology Stack

The existing frontend foundation must be preserved.

## Core Framework

* React
* Vite

## Styling

* Tailwind CSS

## Client State Management

* Redux Toolkit

## Server State Management

* TanStack Query

## HTTP Client

* Axios

## Language

The frontend should use the language and configuration already established in the existing project.

The agent must not migrate the project between JavaScript and TypeScript unless explicitly instructed.

---

# 4. Architecture Principles

The frontend architecture follows these principles:

## 4.1 Feature-Based Organization

Application code should primarily be organized around features rather than placing all files of the same type together.

Example:

```text
features/
├── auth/
├── onboarding/
├── dashboard/
├── trips/
├── incidents/
└── profile/
```

Each feature should contain the code directly related to that domain.

---

## 4.2 Separation of Responsibilities

Different layers should have clear responsibilities.

### UI Components

Responsible for:

* Rendering
* User interaction
* Local UI state

### Feature Logic

Responsible for:

* Feature-specific behavior
* Feature-specific state
* Data transformation

### API Layer

Responsible for:

* HTTP communication
* Request functions
* API endpoint interaction

### Global State

Responsible for application-wide client state only.

### Server State

Responsible for API data and asynchronous server data.

---

## 4.3 Reusability

Reusable UI should be shared rather than duplicated.

Examples:

* Button
* Input
* Modal
* Card
* Loader
* Empty state
* Error state
* Page header
* Confirmation dialog

However, components must not be abstracted unnecessarily.

The architecture should avoid creating generic abstractions for components that are used only once unless there is a clear reason.

---

## 4.4 Scalability

New features should be added without requiring major changes to unrelated features.

For example:

```text
src/features/
├── auth/
├── onboarding/
├── dashboard/
├── trips/
├── incidents/
├── profile/
└── chatbot/
```

Adding a new feature should generally involve adding a new feature module rather than restructuring the entire application.

---

# 5. High-Level Application Flow

The main application flow is:

```text
Application Start
       ↓
Application Initialization
       ↓
Authentication Check
       ↓
┌──────────────────────────────┐
│                              │
No Active User            Active User
│                              │
↓                              ↓
Public Routes             Check Onboarding
                               │
                    ┌──────────┴──────────┐
                    │                     │
             Incomplete              Complete
                    │                     │
                    ↓                     ↓
              Onboarding            Main Application
                                          │
                                          ↓
                                     Dashboard
```

---

# 6. Application Layers

The frontend follows the following logical layers:

```text
Pages
  ↓
Feature Components
  ↓
Hooks / Feature Logic
  ↓
API Functions
  ↓
Axios Client
  ↓
Backend API
```

Shared UI components may be used across multiple feature layers.

Global state and server state are accessed where appropriate.

---

# 7. Proposed Folder Structure

The exact existing structure should be preserved where possible.

The target architecture is:

```text
frontend/
│
├── public/
│   └── assets/
│
├── src/
│   │
│   ├── api/
│   │   ├── axios.js
│   │   └── endpoints.js
│   │
│   ├── app/
│   │   ├── App.jsx
│   │   ├── providers.jsx
│   │   └── store.js
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── illustrations/
│   │
│   ├── components/
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MobileNavigation.jsx
│   │   │
│   │   └── feedback/
│   │       ├── ErrorState.jsx
│   │       ├── EmptyState.jsx
│   │       └── LoadingState.jsx
│   │
│   ├── features/
│   │   │
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── validation/
│   │   │
│   │   ├── onboarding/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │
│   │   ├── trips/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── utils/
│   │   │
│   │   ├── incidents/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │
│   │   ├── profile/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │
│   │   └── chatbot/
│   │       ├── api/
│   │       ├── components/
│   │       └── hooks/
│   │
│   ├── hooks/
│   │   └── shared hooks
│   │
│   ├── lib/
│   │   └── reusable library configuration
│   │
│   ├── routes/
│   │   ├── index.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── PublicRoute.jsx
│   │
│   ├── store/
│   │   └── Redux slices
│   │
│   ├── utils/
│   │   └── shared utility functions
│   │
│   ├── constants/
│   │   └── application constants
│   │
│   ├── main.jsx
│   └── index.css
│
├── .env
├── package.json
├── vite.config.js
│
└── docs/
    ├── PRD.md
    ├── Architecture.md
    ├── Rules.md
    ├── Phases.md
    ├── Design.md
    └── Memory.md
```

This is the **target logical architecture**.

The agent must inspect the current structure before moving or creating folders and should avoid unnecessary restructuring.

---

# 8. Feature Architecture

Each major domain should be treated as a feature.

A feature may contain:

```text
feature/
├── api/
├── components/
├── hooks/
├── pages/
├── validation/
├── utils/
└── constants.js
```

Not every feature needs every folder.

The agent must avoid creating empty or unnecessary directories.

---

# 9. Feature Responsibilities

## 9.1 Auth

Responsible for:

* Sign up
* Sign in
* Authentication state
* Logout
* Route access logic

---

## 9.2 Onboarding

Responsible for:

* Collecting required tourist information
* Onboarding form
* Validation
* Onboarding completion

---

## 9.3 Dashboard

Responsible for:

* Tourist safety overview
* Current location display
* Nearby safe zones
* Risk information
* Quick access to SOS
* Quick access to chatbot
* Trip and incident summary

---

## 9.4 Trips

Responsible for:

* Creating trips
* Solo trips
* Group trips
* Current trip
* Trip history
* Group creation
* Group joining
* QR functionality

---

## 9.5 Incidents

Responsible for:

* Incident reporting
* Incident listing
* Incident history
* Incident-related UI

---

## 9.6 Profile

Responsible for:

* Viewing profile information
* Updating profile information
* Managing onboarding-related personal information where applicable

---

## 9.7 Chatbot

Responsible for:

* Chat interface
* Message display
* Message input
* Chat loading states
* Chat error states

---

# 10. Routing Architecture

Routes are divided into four categories:

1. Public routes
2. Authentication routes
3. Onboarding routes
4. Protected application routes

---

## 10.1 Public Routes

Accessible without authentication.

Examples:

```text
/
```

The landing page belongs here.

---

## 10.2 Authentication Routes

Used for authentication-related screens.

Examples:

```text
/auth/signin
/auth/signup
```

Authenticated users should generally not remain on authentication pages.

---

## 10.3 Onboarding Routes

Used by authenticated users who have not completed onboarding.

Example:

```text
/onboarding
```

Users who have already completed onboarding should not be unnecessarily returned to onboarding.

---

## 10.4 Protected Routes

Accessible only to authenticated users who satisfy required onboarding conditions.

Example:

```text
/app/dashboard
/app/trip
/app/trip/create
/app/trip/history
/app/incidents
/app/profile
```

---

# 11. Route Protection Flow

Protected routes must follow this conceptual logic:

```text
User visits route
       ↓
Authentication state resolved?
       │
       ├── No → Show initialization/loading state
       │
       └── Yes
             ↓
       Authenticated?
             │
             ├── No → Redirect to Sign In
             │
             └── Yes
                   ↓
            Onboarding complete?
                   │
                   ├── No → Redirect to Onboarding
                   │
                   └── Yes → Allow access
```

The application must avoid briefly rendering protected content before authentication state is resolved.

---

# 12. Redux Toolkit Architecture

Redux Toolkit should only manage state that is truly global and client-owned.

Potential Redux state:

```text
store/
├── auth/
│   └── authSlice.js
│
├── user/
│   └── userSlice.js
│
└── ui/
    └── uiSlice.js
```

Examples of appropriate Redux state:

* Authentication status
* Authenticated user summary
* Global UI state
* Client-only application preferences

Redux should not automatically be used for every API response.

---

# 13. TanStack Query Architecture

TanStack Query is responsible for server state.

Examples include:

* User profile
* Trips
* Active trip
* Trip history
* Incidents
* Safe zones
* Risk information

Each server-state feature should generally use:

```text
feature/
├── api/
│   └── featureApi.js
│
└── hooks/
    ├── useFeatureQuery.js
    └── useFeatureMutation.js
```

Example flow:

```text
Component
   ↓
Custom Query Hook
   ↓
API Function
   ↓
Axios Client
   ↓
Backend
```

---

# 14. API Architecture

The application should use a centralized Axios client.

Example conceptual structure:

```text
api/
└── axios.js
```

The Axios client is responsible for shared HTTP configuration such as:

* Base URL
* Common headers
* Credentials
* Request interceptors
* Response interceptors

Feature-specific API functions should remain close to their features.

Example:

```text
features/
└── trips/
    └── api/
        └── tripsApi.js
```

The API layer should not contain UI logic.

---

# 15. API Request Flow

The standard request flow should be:

```text
User Action
     ↓
Component
     ↓
Mutation / Query Hook
     ↓
Feature API Function
     ↓
Axios Client
     ↓
Backend API
     ↓
Response
     ↓
TanStack Query Cache
     ↓
Component Update
```

---

# 16. Query Key Architecture

Query keys should be predictable and feature-based.

Conceptual examples:

```text
["user"]
["profile"]

["trips"]
["trips", tripId]

["activeTrip"]

["incidents"]
["incidents", incidentId]

["safeZones"]

["riskLevel"]
```

Query keys should be centralized where reuse improves consistency.

---

# 17. Authentication Architecture

Authentication state must be resolved during application initialization.

The application should determine:

* Whether the user is authenticated
* Whether user information is available
* Whether onboarding is completed

The initialization process should prevent route flickering.

Conceptual flow:

```text
Application Starts
       ↓
Initialize Auth State
       ↓
Loading?
       │
       ├── Yes → Show Application Loader
       │
       └── No
             ↓
        Authenticated?
             │
        ┌────┴────┐
        │         │
       No        Yes
        │         │
        ↓         ↓
    Public     Onboarding Check
    Routes          │
               ┌────┴────┐
               │         │
             No         Yes
               │         │
               ↓         ↓
          Onboarding   App Routes
```

---

# 18. Layout Architecture

The application should distinguish between:

## Public Layout

Used for:

* Landing page

## Authentication Layout

Used for:

* Sign in
* Sign up

## Application Layout

Used for authenticated application pages.

Potential structure:

```text
AppLayout
├── Sidebar
├── Top Navigation
├── Main Content
└── Mobile Navigation
```

The exact visual implementation is defined in `Design.md`.

---

# 19. Shared Component Architecture

Reusable components should be organized by purpose.

## UI Components

Generic components:

```text
components/ui/
```

Examples:

* Button
* Input
* Select
* Textarea
* Modal
* Card
* Badge

---

## Layout Components

Application structure:

```text
components/layout/
```

Examples:

* AppLayout
* Sidebar
* Navbar
* MobileNavigation

---

## Feedback Components

Shared asynchronous states:

```text
components/feedback/
```

Examples:

* LoadingState
* ErrorState
* EmptyState

---

# 20. Feature Components

Components used only by one feature should remain inside that feature.

Example:

```text
features/
└── trips/
    └── components/
        ├── TripCard.jsx
        ├── CreateTripForm.jsx
        ├── GroupTripForm.jsx
        └── QRJoinDialog.jsx
```

A component should only move to `components/` when it is genuinely shared across multiple unrelated features.

---

# 21. Form Architecture

Forms should:

* Keep validation close to the feature
* Display field-level errors
* Prevent duplicate submissions
* Display submission loading state
* Handle backend validation errors
* Handle network failures

Form state should remain local unless multiple parts of the application require access to it.

Validation files should remain inside the relevant feature.

Example:

```text
features/
└── onboarding/
    └── validation/
        └── onboardingValidation.js
```

---

# 22. Error Handling Architecture

Every major asynchronous operation must explicitly support:

```text
Loading
Error
Empty
Success
```

Error handling should occur at appropriate levels.

## API Layer

Responsible for:

* HTTP request errors
* Response errors

## Query or Mutation Layer

Responsible for:

* Server-state error management
* Mutation state

## UI Layer

Responsible for:

* Displaying understandable error messages
* Retry actions where appropriate

The application must not silently ignore failed operations.

---

# 23. Loading State Architecture

Loading states should exist at multiple levels.

## Application Loading

Used during:

* Initial authentication resolution

## Page Loading

Used when a major page depends on initial data.

## Component Loading

Used when only a specific section is loading.

## Action Loading

Used during:

* Form submission
* SOS processing
* Incident reporting
* Trip creation

The application should avoid blocking the entire page when only a small action is loading.

---

# 24. Empty State Architecture

Empty states must be intentionally designed.

Examples:

* No active trip
* No trip history
* No incidents
* No nearby safe zones
* No chatbot messages

An empty state should explain:

* What is currently empty
* Why it may be empty
* What the user can do next, when applicable

---

# 25. Responsive Architecture

The frontend must support:

* Mobile
* Tablet
* Desktop

Responsive behavior should be implemented at the component level where possible.

The architecture must avoid:

* Separate mobile and desktop page implementations
* Duplicating complete layouts unnecessarily

Shared components should adapt through responsive styling.

---

# 26. Asset Architecture

Static assets should be organized logically.

Example:

```text
src/assets/
├── images/
├── icons/
└── illustrations/
```

Large external media should not be unnecessarily duplicated inside the project.

Assets should be imported consistently.

---

# 27. Constants Architecture

Shared application constants should be stored in:

```text
src/constants/
```

Examples:

* Route constants
* Static configuration
* Application-wide labels where appropriate

Feature-specific constants should remain inside the corresponding feature.

---

# 28. Utility Architecture

Shared utility functions should be stored in:

```text
src/utils/
```

Examples:

* Date formatting
* Value formatting
* Generic helper functions

Feature-specific utilities should remain inside the relevant feature.

---

# 29. Environment Variables

Environment variables must be used for configuration that varies between environments.

Example:

```text
VITE_API_BASE_URL
```

Environment variables must:

* Follow Vite environment variable conventions
* Not expose secrets
* Be accessed through the correct frontend environment mechanism

The frontend must never store backend secrets, private keys, or sensitive credentials.

---

# 30. Data Flow

The preferred data flow is:

```text
Backend
   ↓
Axios
   ↓
Feature API
   ↓
TanStack Query
   ↓
Feature/Page
   ↓
Reusable Components
```

For global client-side state:

```text
User Action
   ↓
Redux Action
   ↓
Redux Slice
   ↓
Global State
   ↓
Components
```

The same data should not be duplicated unnecessarily between Redux and TanStack Query.

---

# 31. Mutation Flow

Mutations should generally follow:

```text
User Action
    ↓
Mutation Hook
    ↓
API Request
    ↓
Success / Error
    ↓
Invalidate or Update Relevant Query
    ↓
UI Update
```

Examples:

* Create trip
* Join group
* Submit incident
* Update profile
* Complete onboarding

---

# 32. Current Trip Architecture

The active trip should be treated as a major application context.

The current trip may influence:

* Dashboard content
* Group information
* Safety information
* Incident reporting

However, active trip server data should remain server state and should not automatically be duplicated into Redux.

A query such as:

```text
["activeTrip"]
```

should be the primary source of truth.

---

# 33. Safety-Critical UI Architecture

Features related to safety require additional attention.

Examples:

* SOS
* Risk information
* Incident reporting
* Current location

These features must:

* Be clearly separated from decorative UI
* Have explicit loading and error states
* Avoid ambiguous interactions
* Provide immediate user feedback

The architecture must prioritize reliability and clarity over unnecessary abstraction.

---

# 34. Code Ownership Rules

Code should generally be placed according to the following rule:

```text
Used by one feature
        ↓
Keep inside feature

Used by multiple features
        ↓
Move to shared components, hooks, utils, or constants
```

The agent must avoid placing all new components directly inside a global `components/` folder.

---

# 35. Architectural Constraints

The frontend agent must:

* Preserve the existing project setup
* Preserve existing working dependencies
* Avoid unnecessary restructuring
* Avoid unnecessary new dependencies
* Reuse existing patterns where appropriate
* Keep feature logic modular
* Use TanStack Query for server state
* Use Redux Toolkit for appropriate global client state
* Use Axios through a centralized configuration
* Keep API calls outside UI components where possible
* Handle loading, error, and empty states
* Keep feature-specific code close to its feature
* Only modify files inside `frontend/`

---

# 36. Architectural Non-Goals

The frontend architecture should not:

* Become a backend architecture
* Contain database logic
* Duplicate backend business logic unnecessarily
* Store sensitive secrets
* Move all state into Redux
* Use global state for temporary component interactions
* Create excessive abstractions
* Create unnecessary micro-components
* Introduce libraries without justification

---

# 37. Expected Development Workflow

Development should follow this sequence:

```text
Read PRD.md
      ↓
Read Architecture.md
      ↓
Read Rules.md
      ↓
Read Phases.md
      ↓
Check Design.md
      ↓
Check Memory.md
      ↓
Implement Current Phase Only
      ↓
Verify Implementation
      ↓
Update Memory.md
```

The agent must not jump ahead and implement future phases unless explicitly instructed.

---

# 38. Source of Truth

The architecture should follow this priority when requirements conflict:

```text
1. Explicit User Instructions
2. PRD.md
3. Rules.md
4. Phases.md
5. Design.md
6. Architecture.md
7. Memory.md
```

If there is a conflict or missing information that could materially affect implementation, the agent should avoid guessing and request clarification.

---

# 39. Architecture Summary

The SIH Tourist Safety frontend follows a **feature-based, scalable architecture** built with:

```text
React + Vite
        +
Tailwind CSS
        +
Redux Toolkit
        +
TanStack Query
        +
Axios
```

The architecture separates:

* Shared UI
* Feature-specific UI
* Client state
* Server state
* API communication
* Routing
* Layouts

All development must remain inside:

```text
frontend/
```

The frontend agent may inspect the broader workspace for context but must never modify anything outside the frontend directory.

The architecture should evolve only when required by the product and should avoid unnecessary complexity or restructuring.

---

# 40. OTP Email Verification Architecture

The frontend authentication flow integrates with an SMTP-based backend OTP verification system.
- **Registration**: `/api/v1/auth/register` creates an unverified account.
- **Verification**: `/api/v1/auth/verify-email` consumes a 6-digit OTP and establishes the session.
- **Resend**: `/api/v1/auth/resend-verification` handles resend subject to cooldown.
Redux Toolkit handles the global authenticated state once verification succeeds.

---

# 41. GPS Tracking & Map Architecture

## 41.1 Browser Geolocation Lifecycle
Location tracking logic is centralized (e.g., in `src/features/tracking/`) and independent of the visual map component. 
It must handle:
- Permission flows (granted, denied).
- Position unavailable/timeout errors.
- `navigator.geolocation.watchPosition` for continuous tracking during active trips.
- Strict cleanup on unmount or when a trip ends to avoid memory leaks.

## 41.2 Map Integration (OpenStreetMap Strategy)
The initial map implementation uses OpenStreetMap.
The architecture separates:
```text
Location State -> Map Component Rendering -> Markers/Polygons
```
The map rendering layer does NOT own the GPS tracking lifecycle. The abstraction must allow future migration to Google Maps API if OSM is insufficient.

---

# 42. Geofencing Architecture

**The backend is the absolute authority on safety and geofence evaluations.**
The frontend architecture must follow this flow:
```text
Browser GPS -> Frontend Tracking Service -> Backend Ping (`/api/v1/tracking/pings`) -> Backend Geofence Evaluation -> Server State (HTTP/Socket) -> Frontend UI Update
```
- The frontend will visualize geofences by fetching `/api/v1/risk-zones` but MUST NOT execute local algorithms to trigger critical safety alerts based solely on client-side overlap checks.
- Geometry definitions (polygons/circles) are strictly consumed from backend API contracts.

---

# 43. Socket.IO Real-Time Architecture

The backend exposes a Socket.IO connection (currently Phase 0, without full location/incident event support yet).
When authenticated gateways are enabled, the frontend architecture for real-time data will follow:

## 43.1 Socket Lifecycle
1. Connect after establishing a verified session.
2. Complete authentication handshake (using established tokens).
3. Join relevant rooms (Trip, Group).
4. Register single-instance listeners for real-time events.
5. Invalidate/update TanStack Query caches based on payload.
6. Cleanly disconnect on logout or unmount.

## 43.2 Server-State Synchronization
Socket.IO events MUST NOT duplicate backend data into Redux. Instead, events will trigger `queryClient.setQueryData` or `queryClient.invalidateQueries` to immediately reflect live alerts, incident updates, and notifications on the UI.

## Blockchain credential flow

Trip credentials are intentionally API-driven. `CurrentTripPage` calls `credentialService`, which reads signed QR payloads from the backend. The browser does not connect to an RPC node or wallet. Scans land on `/verify/:token`, and that page calls the public verification API. This keeps chain access, retries, and signer isolation outside React.
