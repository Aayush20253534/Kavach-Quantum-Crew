# Client Frontend File Guide

> **Documentation status:** Updated 29 August 2026. This document describes the current `client/` application only. Backend, blockchain, and `ai-ml/` files are intentionally out of scope except where the frontend calls their APIs.

## Purpose

This is the canonical file-by-file guide for the KAVACH client. It explains what each client folder means, what each library is used for, what functionality exists in the frontend, and how the major files fit together.

The source code remains the final authority. When behavior changes, update this guide together with `client/README.md`, `client/Memory.md`, and the relevant files under `client/docs/`.

## Client Boundary

The frontend lives in:

```text
client/
```

Generated dependencies under `client/node_modules/`, build output under `client/dist/`, and OS metadata such as `.DS_Store` are not documented file-by-file because they are installed/generated artifacts. The meaningful maintained client files are the source, public assets, configuration, package metadata, and documentation listed below.

## Technology Stack And Library Usage

| Library | Where used | Meaning in this client |
| --- | --- | --- |
| React 19 | `src/main.jsx`, `src/app/**`, every page/component | Component model, local UI state, effects, refs, memoized values, and rendering. |
| React DOM | `src/main.jsx` | Mounts the React app into `#root` from `index.html`. |
| Vite 8 | `vite.config.js`, `index.html` | Development server, module bundling, environment variable injection, and production builds. |
| `@vitejs/plugin-react` | `vite.config.js` | Enables React Fast Refresh and JSX handling in Vite. |
| Tailwind CSS 4 | `src/styles/globals.css`, class names across JSX | Utility-first styling system for layouts, role shells, cards, forms, dashboards, maps, and responsive behavior. |
| `@tailwindcss/vite` | `vite.config.js` | Wires Tailwind 4 into the Vite build pipeline. |
| React Router 7 | `src/app/router.jsx`, layouts, pages | Browser routing, nested layouts, protected routes, role-specific sections, URL params, search params, and redirects. |
| Redux Toolkit | `src/store/index.js`, `src/features/auth/store/authSlice.js` | Global client state for authentication, current user, initialization, and onboarding completion. |
| React Redux | `src/app/providers.jsx`, layouts, guards, auth pages | Connects React components to the Redux store with `Provider`, `useSelector`, and `useDispatch`. |
| TanStack Query | `src/services/queryClient.js`, `src/features/*/api/*Queries.js` | Server-state caching, polling, retries, mutations, and invalidation for trips, groups, tracking, notifications, safety, authority, and dashboard data. |
| TanStack Query Devtools | `src/app/providers.jsx` | Development inspection panel for query cache and request state. |
| Axios | `src/services/apiClient.js`, `src/services/chatbotClient.js` | HTTP transport for the main backend and separate Rakshak AI service, including auth headers and refresh behavior. |
| Socket.IO Client | `src/services/realtimeClient.js`, current-trip and authority pages | Authenticated realtime connection for dispatch and blockchain-integrity updates. |
| React Hook Form | Login, registration, onboarding | Form state, validation binding, controlled fields, and submit handling. |
| Zod | Login, registration, onboarding | Runtime form schemas and user-facing validation messages. |
| `@hookform/resolvers` | Login, registration, onboarding | Connects Zod schemas to React Hook Form. |
| Lucide React | Most layouts, pages, UI components | Icon system for navigation, metrics, emergency states, forms, maps, actions, and empty states. |
| `@react-google-maps/api` | Authority maps, tracking maps, responder maps | Google Maps rendering, markers, polygons, circles, info windows, directions, geocoding, places search, and jurisdiction/operations views. |
| `html5-qrcode` | `src/features/groups/pages/JoinGroupPage.jsx` | Camera and image-file QR scanning for group invitation/join flows. |
| `qrcode.react` | `src/features/trips/pages/CurrentTripPage.jsx` | Renders individual and group credential QR codes. |
| `clsx` | `src/lib/utils.js` | Conditional class-name composition. |
| `tailwind-merge` | `src/lib/utils.js` | Merges Tailwind classes so later variants override conflicting earlier utilities. |
| Leaflet / React Leaflet | Package metadata, legacy map support | Installed for map support, though the current active map components primarily use Google Maps. |
| ESLint / React Hooks plugin / React Refresh plugin | `eslint.config.js` | Static checks for JavaScript, JSX, hooks rules, and Vite-compatible component exports. |
| Prettier / ESLint Prettier config/plugin | Package metadata | Formatting/lint ecosystem dependencies available to the client. |
| `globals` | `eslint.config.js` | Browser global definitions for linting. |

## Runtime Flow

1. `index.html` exposes `<div id="root"></div>` and loads `src/main.jsx`.
2. `src/main.jsx` imports global styles and mounts `<App />`.
3. `src/app/App.jsx` wraps the router with global providers and auth initialization.
4. `src/app/providers.jsx` installs Redux and TanStack Query.
5. `src/app/guards/AuthInitializer.jsx` restores or refreshes the session before route rendering settles.
6. `src/app/router.jsx` defines all public, auth, onboarding, tourist, authority, admin, and responder routes.
7. Layouts under `src/app/layouts/` provide role-specific shells and shared sign-out behavior.
8. Feature pages under `src/features/**/pages/` render workflows and call feature API wrappers.
9. Shared service clients under `src/services/` own HTTP, AI, query, and realtime infrastructure.

## Functional Surface

The client implements:

- Public home and 404 pages.
- Tourist registration, login, email OTP verification, password reset, onboarding, profile editing, medical/profile document upload, dashboard, trip creation, active trip control, trip history, group creation/join requests, QR scanning, live tracking, incident reporting, evidence upload, check-ins, notifications, SOS, shared responder tracking, and Rakshak AI chat.
- Disaster Management dashboards for jurisdiction overview, incidents, incident details, incident chat, active dispatches, risk zones, hazards, responders, analytics, emergency-service account creation, and shared dispatch tracking.
- System Admin dashboards for platform summary, account management, destination/location management, risk zones, and audit/diagnostics.
- Emergency responder shell for Police, Fire, and Ambulance/Hospital accounts, including active dispatch status progression, live GPS synchronization, dispatch tracking, and dispatch history.
- Credential verification for signed individual/group QR tokens.

## Top-Level Client Files

| File | Meaning |
| --- | --- |
| `.gitignore` | Client-level ignore rules for generated files and local artifacts. |
| `.env.example` | Documents browser-exposed Vite variables: main API URL, public app URL, optional Socket.IO origin, and separate Rakshak AI origin. Secrets must not be placed here. |
| `index.html` | Vite HTML entry, favicon reference, viewport metadata, app description, title, and `src/main.jsx` script tag. |
| `package.json` | Client package metadata, npm scripts, runtime dependencies, and development tooling. |
| `package-lock.json` | Locked dependency graph for repeatable client installs. |
| `vite.config.js` | Vite configuration using React and Tailwind plugins. |
| `eslint.config.js` | Flat ESLint configuration for JS/JSX source files, browser globals, hooks checks, React Refresh rules, and ignored `dist/`. |
| `vercel.json` | SPA rewrite rule so direct route visits resolve to `index.html` on Vercel. |
| `README.md` | Human-facing overview of the current frontend, stack, routes, environment, and documentation entry points. |
| `Memory.md` | Living project-state notes for current frontend behavior and known integration details. |

## Documentation Files

| File | Meaning |
| --- | --- |
| `docs/CLIENT-FILE-GUIDE.md` | This canonical, exhaustive client file/folder guide. |
| `docs/Architecture.md` | Frontend architecture, layering, routing, state, and contribution boundaries. Now points to this guide for the full file catalogue. |
| `docs/ENDPOINTS.md` | Frontend-facing API catalogue grouped by product domain. |
| `docs/EMERGENCY-SERVICE-DISPATCH.md` | Dispatch-specific frontend/backend integration behavior for Police, Fire, Ambulance, Disaster Management, and tourist shared tracking. |
| `docs/PRD.md` | Product requirements and historical product scope for the frontend experience. |
| `docs/Rules.md` | Operating rules for people/agents changing the client, including stack discipline and documentation upkeep. |

## Public Asset Files

Files in `public/` are served from the site root at runtime.

| File | Meaning |
| --- | --- |
| `public/auth_bg.jpg` | Auth-screen background image used by the login/register/auth layout experience. |
| `public/Logo/kavach-logo.png` | Main Kavach logo and favicon source referenced by `index.html` and branding surfaces. |
| `public/Locations/Delhi.jpg` | Destination/location image for Delhi administrative or travel content. |
| `public/Locations/Kanpur.jpg` | Destination/location image for Kanpur administrative or travel content. |
| `public/Locations/Lucknow.jpg` | Destination/location image for Lucknow administrative or travel content. |
| `public/Locations/Prayagraj.jpg` | Destination/location image for Prayagraj administrative or travel content. |
| `public/destinations/bagh.jpg` | Destination image for Khusro Bagh or related attraction cards. |
| `public/destinations/bhavan.jpg` | Destination image for Anand Bhavan or related attraction cards. |
| `public/destinations/fort.jpg` | Destination image for Prayagraj Fort or related attraction cards. |
| `public/destinations/group_trip.jpg` | Group-trip promotional/selection image. |
| `public/destinations/kumbh.jpg` | Kumbh-related destination/travel image. |
| `public/destinations/sangam.jpg` | Sangam destination image. |
| `public/destinations/solo_trip.jpg` | Solo-trip promotional/selection image. |
| `public/destinations/temple.jpg` | Temple destination image. |

## Source Asset Files

Files in `src/assets/` are bundled by Vite when imported from source.

| File | Meaning |
| --- | --- |
| `src/assets/hero.png` | Bundled hero/landing visual asset. |
| `src/assets/prayagraj-temple.jpg` | Bundled Prayagraj temple image for local UI use. |
| `src/assets/vite.svg` | Original Vite scaffold asset; currently not part of the core Kavach product UI. |

## Source Folder Meanings

| Folder | Meaning |
| --- | --- |
| `src/app/` | Application composition: app root, route tree, role layouts, route guards, and app-level components. |
| `src/app/components/` | Components shared by application shells rather than by feature pages. |
| `src/app/guards/` | Route-protection wrappers that decide where authenticated, unauthenticated, role-specific, and onboarding users may go. |
| `src/app/layouts/` | Nested layout shells for public, auth, tourist, authority, admin, responder, and global experiences. |
| `src/components/` | Reusable cross-feature UI and the global chatbot widget. |
| `src/components/chatbot/` | Rakshak AI floating assistant UI. |
| `src/components/ui/` | Shared primitives such as buttons, cards, inputs, modals, loaders, badges, and emergency buttons. |
| `src/features/` | Feature-first modules. Each domain owns its pages, API wrappers, query hooks, constants, components, or utilities. |
| `src/features/admin/` | System Admin pages and API wrappers. |
| `src/features/auth/` | Authentication forms, account flows, auth service, gallery component, and Redux auth slice. |
| `src/features/authority/` | Disaster Management command-center pages, service wrappers, query hooks, and operational maps. |
| `src/features/credentials/` | Public credential verification API and page. |
| `src/features/dashboard/` | Tourist dashboard summary API/query layer. |
| `src/features/destinations/` | Destination list API wrapper. |
| `src/features/emergency-services/` | Police/Fire/Ambulance responder APIs and routed pages. |
| `src/features/groups/` | Group-trip creation, QR invitation, join-request, signal-loss, and membership APIs/pages. |
| `src/features/incidents/` | Tourist incident reporting, incident history, and evidence upload UI. |
| `src/features/notifications/` | Notification API and query hooks used by the tourist shell dropdown. |
| `src/features/onboarding/` | Tourist profile onboarding form, scrollable select, and option constants. |
| `src/features/profile/` | Tourist profile API and editable profile page. |
| `src/features/public/` | Public marketing/home and not-found pages plus local Prayagraj images. |
| `src/features/safety/` | SOS, hazards, alerts, check-ins, evidence APIs, and emergency location utilities. |
| `src/features/tourist/` | Tourist dashboard page. |
| `src/features/tracking/` | Tourist/group/fleet maps, browser geolocation hook, tracking API, and geofence math. |
| `src/features/trips/` | Trip lifecycle APIs/pages, AI trip planner mock, current-trip QR/credential UI, and trip history. |
| `src/lib/` | General-purpose shared helpers. |
| `src/services/` | Cross-cutting HTTP, AI, realtime, and query-client infrastructure. |
| `src/store/` | Redux store composition. |
| `src/styles/` | Global Tailwind import, theme tokens, base styles, and global responsive fixes. |

## Complete Folder Catalogue

| Folder | Meaning |
| --- | --- |
| `client/` | Frontend package root. Contains client source, public assets, package metadata, configuration, and client documentation. |
| `docs/` | Client-maintained documentation. Keeps architecture, endpoint, dispatch, rules, PRD, and this file guide close to the frontend. |
| `public/` | Static files served directly from the web root without bundling. Used for favicons, route-stable images, and destination/location assets. |
| `public/Locations/` | Static city/location images used by destination/location management and travel surfaces. |
| `public/Logo/` | Brand logo assets, including the favicon source. |
| `public/destinations/` | Static attraction/trip-type imagery for tourist destination and trip selection experiences. |
| `src/` | Vite-bundled application source. All executable frontend code and imported assets live here. |
| `src/app/` | App composition layer: root app component, providers, router, layout shells, route guards, and shell-level components. |
| `src/app/components/` | Components owned by app shells rather than one product feature, such as notifications and logout confirmation. |
| `src/app/guards/` | Route access-control components that interpret auth, role, and onboarding state. |
| `src/app/layouts/` | Nested layout shells that give each role its navigation, theme, logout behavior, and persistent background responsibilities. |
| `src/assets/` | Bundled image/SVG assets imported by source files. |
| `src/components/` | Cross-feature reusable components. Kept separate from app-shell components and feature-specific components. |
| `src/components/chatbot/` | Floating Rakshak AI assistant UI. |
| `src/components/ui/` | Shared UI primitives for form controls, cards, modals, loaders, badges, and SOS action components. |
| `src/features/` | Domain-oriented feature modules. New product capabilities should usually live here. |
| `src/features/admin/` | System Admin domain for platform administration. |
| `src/features/admin/api/` | System Admin HTTP wrapper functions. |
| `src/features/admin/pages/` | Routed System Admin screens. |
| `src/features/auth/` | Authentication and account-entry domain. |
| `src/features/auth/api/` | Auth HTTP wrapper functions. |
| `src/features/auth/components/` | Auth-only visual/support components. |
| `src/features/auth/pages/` | Login, registration, email verification, and password reset screens. |
| `src/features/auth/store/` | Redux slice for auth and current-user state. |
| `src/features/authority/` | Disaster Management command-center domain. |
| `src/features/authority/api/` | Authority HTTP wrappers and TanStack Query hooks. |
| `src/features/authority/components/` | Authority-specific operational map components. |
| `src/features/authority/pages/` | Routed Disaster Management screens. |
| `src/features/credentials/` | Credential verification domain for individual/group QR tokens. |
| `src/features/credentials/api/` | Credential HTTP wrapper functions. |
| `src/features/credentials/pages/` | Public credential verification screen. |
| `src/features/dashboard/` | Tourist dashboard data domain. |
| `src/features/dashboard/api/` | Tourist dashboard service and query hook. |
| `src/features/destinations/` | Destination discovery/listing domain. |
| `src/features/destinations/api/` | Destination listing HTTP wrapper. |
| `src/features/emergency-services/` | Responder portal domain for Police, Fire, and Ambulance/Hospital users. |
| `src/features/emergency-services/api/` | Responder HTTP wrapper functions. |
| `src/features/emergency-services/pages/` | Routed responder and shared dispatch tracking screens. |
| `src/features/groups/` | Group-trip domain for group creation, invitations, join requests, QR scanning, and signal-loss response. |
| `src/features/groups/api/` | Group HTTP wrappers and TanStack Query hooks. |
| `src/features/groups/pages/` | Routed group creation/join screens. |
| `src/features/incidents/` | Tourist incident/hazard reporting and history domain. |
| `src/features/incidents/components/` | Incident-specific reusable UI such as evidence upload. |
| `src/features/incidents/pages/` | Routed tourist incident report/history screens. |
| `src/features/notifications/` | Notification data domain used by role shells. |
| `src/features/notifications/api/` | Notification HTTP wrappers and query hooks. |
| `src/features/onboarding/` | Tourist onboarding domain. |
| `src/features/onboarding/components/` | Onboarding-specific form controls. |
| `src/features/onboarding/constants/` | Large option lists and helper functions for onboarding/profile fields. |
| `src/features/onboarding/pages/` | Routed onboarding form. |
| `src/features/profile/` | Tourist profile domain. |
| `src/features/profile/api/` | Profile HTTP wrapper functions. |
| `src/features/profile/pages/` | Routed tourist profile page. |
| `src/features/public/` | Public unauthenticated site domain. |
| `src/features/public/images/` | Bundled public-page imagery. |
| `src/features/public/images/prayagraj/` | Prayagraj-specific public-page images. |
| `src/features/public/pages/` | Public home and not-found screens. |
| `src/features/safety/` | Tourist safety domain for SOS, alerts, hazards, check-ins, evidence, and emergency location. |
| `src/features/safety/api/` | Safety HTTP wrappers and query hooks. |
| `src/features/safety/pages/` | Routed tourist check-in screen. |
| `src/features/safety/utils/` | Safety helper utilities independent of rendering. |
| `src/features/tourist/` | Tourist dashboard feature page. |
| `src/features/tourist/pages/` | Routed tourist dashboard screen. |
| `src/features/tracking/` | Location tracking, map rendering, fleet overlays, and geofence safety domain. |
| `src/features/tracking/api/` | Tracking HTTP wrappers and query hooks. |
| `src/features/tracking/components/` | Map and route overlay components. |
| `src/features/tracking/hooks/` | Browser geolocation hooks. |
| `src/features/tracking/pages/` | Routed tourist live tracking screen. |
| `src/features/tracking/utils/` | Geospatial calculations used by tracking/safety UI. |
| `src/features/trips/` | Trip lifecycle, AI planner, current trip, credentials, and history domain. |
| `src/features/trips/api/` | Trip HTTP wrappers and query hooks. |
| `src/features/trips/components/` | Trip-specific reusable UI. |
| `src/features/trips/components/ai-planner/` | Itinerary and hotel UI used by the AI planner screen. |
| `src/features/trips/pages/` | Routed trip creation, current trip, AI planner, and history screens. |
| `src/lib/` | Shared low-level helpers. |
| `src/services/` | Cross-feature service clients for HTTP, AI, query caching, and realtime sockets. |
| `src/store/` | Global Redux store setup. |
| `src/styles/` | Global stylesheet and Tailwind theme/base overrides. |

## App Files

| File | Meaning |
| --- | --- |
| `src/main.jsx` | React entrypoint. Imports `globals.css`, creates the root, and renders the app inside `StrictMode`. |
| `src/app/App.jsx` | Top-level React component. Wraps the router in `Providers` and `AuthInitializer`. |
| `src/app/providers.jsx` | Installs Redux `Provider`, TanStack `QueryClientProvider`, and query devtools. |
| `src/app/router.jsx` | Complete route table. Defines `/`, `/login`, `/register`, `/forgot-password`, `/verify-email`, `/verify/:token`, `/onboarding`, `/tourist/**`, `/authority/**`, `/admin/**`, `/responder/**`, and wildcard 404 behavior. |

## App Components

| File | Meaning |
| --- | --- |
| `src/app/components/NotificationsDropdown.jsx` | Tourist notification bell. Polls list/unread count, shows relative times and severity icons, supports single/all read actions, and closes on outside click. |
| `src/app/components/SignOutConfirmModal.jsx` | Shared logout confirmation dialog used by role shells before calling auth logout and clearing local session state. |

## Guards

| File | Meaning |
| --- | --- |
| `src/app/guards/AuthInitializer.jsx` | Session bootstrapper. Reads stored access token, honors explicit sign-out, supports dev role fallback, calls `/auth/me`, refreshes via `/auth/refresh`, updates Redux, and listens for global auth failure events. |
| `src/app/guards/PublicRoute.jsx` | Keeps authenticated users away from public auth routes and redirects them to their role-appropriate home. |
| `src/app/guards/ProtectedRoute.jsx` | Requires an authenticated user before rendering protected route children. |
| `src/app/guards/RoleRoute.jsx` | Requires the current user role to be in an allowed role list. |
| `src/app/guards/OnboardingRoute.jsx` | Sends unauthenticated users to login, completed tourists to their dashboard, and incomplete tourists into onboarding. |

## Layouts

| File | Meaning |
| --- | --- |
| `src/app/layouts/GlobalLayout.jsx` | Wraps the whole app route outlet and mounts the floating `ChatbotWidget`. |
| `src/app/layouts/PublicLayout.jsx` | Public landing shell with logo/nav controls and nested outlet. |
| `src/app/layouts/AuthLayout.jsx` | Auth-page layout that pairs form pages with the Prayagraj gallery/visual area. |
| `src/app/layouts/TouristLayout.jsx` | Mobile-first tourist app shell. Owns nav, time/date display, live geolocation for active trips, background dashboard safety summary, SOS modal flow, notifications dropdown, and logout. |
| `src/app/layouts/AuthorityLayout.jsx` | Disaster Management shell. Loads jurisdiction overview, shows command metrics, manages collapsible navigation, and exposes authority pages. |
| `src/app/layouts/AdminLayout.jsx` | System Admin shell with neutral navigation, account context, collapse state, and logout. |
| `src/app/layouts/ResponderLayout.jsx` | Shared Police/Fire/Ambulance shell. Loads responder profile, polls active dispatches/tracking, watches browser GPS, sends live dispatch locations, themes by responder role, and passes background tracking context to child routes. |

## Shared UI And Chatbot

| File | Meaning |
| --- | --- |
| `src/components/chatbot/ChatbotWidget.jsx` | Floating Rakshak AI assistant. Loads persisted chat history from the AI service, sends messages with conversation context, renders simple markdown, provides quick actions, clears visible history, and handles unavailable/unauthorized AI states gracefully. |
| `src/components/ui/Badge.jsx` | Status/severity badge primitive with icon and color variants. |
| `src/components/ui/Button.jsx` | Shared button primitive with variants, sizes, loading state, and ref forwarding. |
| `src/components/ui/Card.jsx` | Card primitives: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`. |
| `src/components/ui/EmptyState.jsx` | Reusable empty-state block with optional icon/action for missing data or filtered results. |
| `src/components/ui/Input.jsx` | Shared text input primitive with Tailwind focus/error styling and ref forwarding. |
| `src/components/ui/Loader.jsx` | Loading primitives: inline spinner, full-page session loader, skeleton card, and skeleton list. |
| `src/components/ui/Modal.jsx` | Shared modal wrapper with escape-key close, backdrop, title, and close button. |
| `src/components/ui/SOSButton.jsx` | Reusable emergency button with confirmation countdown, immediate dispatch option, current-trip lookup, emergency location resolution, and SOS API submission. |
| `src/components/ui/Select.jsx` | Shared select primitive with chevron decoration and ref forwarding. |
| `src/components/ui/Textarea.jsx` | Shared textarea primitive with consistent form styling and ref forwarding. |

## Services, Store, Styles, And Utils

| File | Meaning |
| --- | --- |
| `src/services/apiClient.js` | Main Axios client. Stores access tokens, marks explicit sign-out, attaches bearer tokens, refreshes sessions on eligible 401 responses, queues requests during refresh, avoids destructive logout on transient errors, and emits auth failure events. |
| `src/services/chatbotClient.js` | Separate Axios client for Rakshak AI. Uses `VITE_AI_SERVICE_URL`, attaches the current access token, refreshes once on 401, and exposes send/history/clear helpers. |
| `src/services/queryClient.js` | TanStack Query configuration. Disables retries for 4xx errors, retries non-client errors once, sets default stale time, disables window-focus refetch by default, and disables mutation retries. |
| `src/services/realtimeClient.js` | Socket.IO factory. Normalizes socket origin from `VITE_SOCKET_URL` or `VITE_API_URL`, attaches auth token, enables websocket/polling fallback, credentials, reconnection, and manual connect. |
| `src/store/index.js` | Redux store setup with the auth reducer. |
| `src/features/auth/store/authSlice.js` | Auth Redux slice. Initializes from `localStorage`, stores user/auth flags, updates user data, marks onboarding complete, marks initialization done, and clears auth on logout. |
| `src/lib/utils.js` | `cn()` helper combining `clsx` and `tailwind-merge` for predictable Tailwind class composition. |
| `src/styles/globals.css` | Tailwind import, theme colors, base body styles, and mobile dashboard overflow/sizing fixes for long stat values. |

## Admin Feature Files

| File | Meaning |
| --- | --- |
| `src/features/admin/api/adminService.js` | System Admin API wrapper for dashboard summary, accounts, account status, resources, audit logs, observability, diagnostics, destinations, and destination image upload. |
| `src/features/admin/pages/AdminDashboardPage.jsx` | Admin home showing platform metrics, service diagnostics, and shortcuts to locations, zones, accounts, and audit screens. |
| `src/features/admin/pages/AdminAccountsPage.jsx` | Account management page with role/filter/search controls, fleet aggregation across responder roles, and activate/suspend status toggles. |
| `src/features/admin/pages/AdminLocationsPage.jsx` | Destination/location CRUD page with search, featured/active toggles, image upload, edit/reset/remove behavior, and admin form fields. |
| `src/features/admin/pages/AdminAuditPage.jsx` | Audit and diagnostics page. Loads audit logs, summary metrics, and observability diagnostics for system monitoring. |

## Auth Feature Files

| File | Meaning |
| --- | --- |
| `src/features/auth/api/authService.js` | Auth API wrapper for username availability, tourist registration, email OTP verification/resend, password reset request/verify/reset, login, current user, and logout. |
| `src/features/auth/components/PrayagrajGallery.jsx` | Auth-side visual gallery of Prayagraj places with selectable slides and local descriptive metadata. |
| `src/features/auth/pages/LoginPage.jsx` | Role-aware login form using React Hook Form and Zod. Supports tourist, Disaster Management, System Admin, Police, Fire, and Ambulance/Hospital role selection and stores authenticated session data. |
| `src/features/auth/pages/RegisterPage.jsx` | Tourist registration page with schema validation, debounced username availability checks, password confirmation, and redirect to email verification. |
| `src/features/auth/pages/VerifyEmailPage.jsx` | Six-digit email OTP flow with digit boxes, paste handling, resend countdown, access-token storage, Redux auth update, and role/onboarding navigation. |
| `src/features/auth/pages/ForgotPasswordPage.jsx` | Three-step password reset: request email OTP, verify six-digit OTP, then submit and confirm new password. Includes resend cooldown and password visibility toggles. |

## Onboarding And Profile Files

| File | Meaning |
| --- | --- |
| `src/features/onboarding/constants/onboardingOptions.js` | Nationality, country-code-to-flag, language, relationship, blood group, and government-ID option lists for onboarding/profile forms. |
| `src/features/onboarding/components/ScrollableSelect.jsx` | Searchable dropdown/select component for long option lists such as nationality and language. |
| `src/features/onboarding/pages/OnboardingPage.jsx` | Multi-step tourist onboarding form. Uses React Hook Form, Zod, controlled selects, phone/digit constraints, government ID fields, medical/safety information, and submits profile data. |
| `src/features/profile/api/profileService.js` | Tourist profile API wrapper for onboarding submission, profile read/update, medical document upload, and profile image upload. |
| `src/features/profile/pages/ProfilePage.jsx` | Tourist profile editor with locked fields during planned/active trips, editable safety/contact/medical preferences, image/document upload, Redux user updates, and sign-out modal. |

## Public And Credential Files

| File | Meaning |
| --- | --- |
| `src/features/public/pages/HomePage.jsx` | Public landing page for Kavach with safety, travel, and call-to-action sections. |
| `src/features/public/pages/NotFoundPage.jsx` | Styled 404 page with navigation back/home actions. |
| `src/features/public/images/prayagraj/fort.jpg` | Local image for the public Prayagraj fort visual. |
| `src/features/public/images/prayagraj/ghat.jpg` | Local image for the public Prayagraj ghat visual. |
| `src/features/public/images/prayagraj/hanuman.jpg` | Local image for the public Hanuman temple visual. |
| `src/features/public/images/prayagraj/sangam.jpg` | Local image for the public Sangam visual. |
| `src/features/credentials/api/credentialService.js` | Credential API wrapper for current tourist credential, group credential, and public token verification. |
| `src/features/credentials/pages/CredentialVerifyPage.jsx` | Public verification page for scanned QR/signed credential links, showing validity, lifecycle, ownership, and failure states. |

## Tourist Dashboard, Trips, Groups, Tracking, Safety, And Incidents

| File | Meaning |
| --- | --- |
| `src/features/dashboard/api/dashboardService.js` | Tourist dashboard summary API wrapper, optionally sending latitude/longitude for location-aware safety summary. |
| `src/features/dashboard/api/dashboardQueries.js` | TanStack query hook for tourist dashboard summary with location-keyed cache and 30-second polling. |
| `src/features/destinations/api/destinationService.js` | Public destination list API wrapper with search, featured, and limit query params. |
| `src/features/tourist/pages/TouristDashboardPage.jsx` | Tourist home dashboard combining profile, current trip, destination recommendations, location-aware summary, safety status, and map preview. |
| `src/features/trips/api/tripService.js` | Trip API wrapper for AI planner mock, create/current/history/detail/start/extend/complete/cancel, safety ID issuance, consent, and check-ins. |
| `src/features/trips/api/tripQueries.js` | TanStack trip hooks and keys for current trip, history, detail, create/start/complete/cancel mutations, and cache invalidation. |
| `src/features/trips/pages/CreateTripPage.jsx` | Trip creation page using destination search, selected destination data, solo/group trip choices, start/end times, and optional group setup. |
| `src/features/trips/pages/CurrentTripPage.jsx` | Active/current trip operations page. Handles start/complete/cancel/extend, group creation/invitations, pending join approvals, signal-loss responses, QR rendering, credential fetching, realtime blockchain-integrity updates, and shared dispatch links. |
| `src/features/trips/pages/TripHistoryPage.jsx` | Trip history page with date/duration formatting and past-trip listing states. |
| `src/features/trips/pages/AITripPlannerPage.jsx` | AI trip planner UI that currently calls the mocked `planTripWithAI` response, shows loading steps, itinerary timeline, and hotel recommendations. |
| `src/features/trips/components/ai-planner/ItineraryTimeline.jsx` | Renders day-by-day itinerary places with formatted times, map links, thumbnails, and action icons. |
| `src/features/trips/components/ai-planner/HotelRecommendations.jsx` | Renders hotel recommendation cards with price formatting, ratings, classes, thumbnails, and external-link affordance. |
| `src/features/groups/api/groupService.js` | Group API wrapper for group creation/details, invitations, join preview/request, QR preview/request, join-request status, pending requests, approve/reject, signal-loss cases/responses, leave group, and remove member. |
| `src/features/groups/api/groupQueries.js` | TanStack group hooks and keys for trip group, create group, create invitation, join group, and trip-cache invalidation after joins. |
| `src/features/groups/pages/CreateGroupPage.jsx` | Lightweight tourist page explaining group creation through the current-trip flow and linking back to trip management. |
| `src/features/groups/pages/JoinGroupPage.jsx` | QR/manual group join page. Scans camera/image QR codes, normalizes payloads and links, previews groups, submits join requests, polls request status, and can send an initial location ping after joining. |
| `src/features/tracking/api/trackingService.js` | Tracking API wrapper for risk zones, location pings, latest individual/group locations, and tracking consent. Converts browser geolocation into backend ping payloads. |
| `src/features/tracking/api/trackingQueries.js` | TanStack tracking hooks for risk zones, latest group locations, and send-ping mutations. |
| `src/features/tracking/hooks/useGeolocation.js` | Browser geolocation hook. Watches active trip location, tracks permission/errors, sends pings, records accuracy/speed/heading/battery when available, and cleans up watches. |
| `src/features/tracking/components/MapComponent.jsx` | Main tourist map. Uses Google Maps for current location, group members, risk/safe zones, group geofence radius, emergency services nearby search, info windows, and fleet response overlays. |
| `src/features/tracking/components/FleetResponseOverlay.jsx` | Google Maps overlay for emergency fleet responses, including route calculation, travelled/remaining route segments, reference markers, and destination connectors. |
| `src/features/tracking/pages/LiveTrackingPage.jsx` | Tourist live tracking page combining current trip, group data, latest member locations, active fleet responses, danger-zone evaluation, geofence status, and live geolocation. |
| `src/features/tracking/utils/geofenceSafety.js` | Geospatial math for meters-between, danger-zone detection, polygon parsing, point-in-polygon checks, segment distance, radius/polygon intersection, and trip danger-zone lookup. |
| `src/features/safety/api/safetyService.js` | Safety API wrapper for SOS, hazard reporting, own hazards/incidents, multipart evidence upload, alerts, and alert acknowledgement. |
| `src/features/safety/api/safetyQueries.js` | TanStack safety hooks for SOS, hazard reporting, evidence upload, and alert polling. |
| `src/features/safety/pages/TouristCheckinsPage.jsx` | Tourist check-in page for listing trip check-ins, scheduling new check-ins, and completing due check-ins. |
| `src/features/safety/utils/emergencyLocation.js` | Emergency location resolver. Validates coordinates, normalizes fallback/current values, requests fresh browser GPS, and exposes validity checks for SOS/reporting. |
| `src/features/incidents/components/EvidenceUploader.jsx` | Multipart evidence uploader for incidents or hazards with loading, success, and linked-file states. |
| `src/features/incidents/pages/ReportIncidentPage.jsx` | Tourist incident/hazard reporting form with category dropdown, geolocation, description/details, submit state, and optional evidence upload after creation. |
| `src/features/incidents/pages/IncidentHistoryPage.jsx` | Tourist incident and hazard history view with structured detail formatting, status/severity display, and empty/loading/error states. |
| `src/features/notifications/api/notificationService.js` | Notification API wrapper for list, unread count, mark-one-read, and mark-all-read. |
| `src/features/notifications/api/notificationQueries.js` | TanStack notification hooks with 30-second polling and invalidation after read actions. |

## Authority And Emergency Responder Files

| File | Meaning |
| --- | --- |
| `src/features/authority/api/authorityService.js` | Disaster Management API wrapper for emergency-service account creation, dashboard, jurisdiction overview, incidents, messages, evidence, dispatches, units, risk zones, hazards, responders, and analytics. |
| `src/features/authority/api/authorityQueries.js` | TanStack authority hooks for incident/alert polling and resolving incidents with cache invalidation. |
| `src/features/authority/components/AuthorityJurisdictionMap.jsx` | Google Map for Disaster Management jurisdiction context, nearby police/fire/hospital service markers, and selected-service info windows. |
| `src/features/authority/components/AuthorityOperationsMap.jsx` | Operational Google Map for incidents, units, base/reference points, active routes, route summaries, distance formatting, and route snapping/offset calculations. |
| `src/features/authority/pages/AuthorityDashboardPage.jsx` | Command dashboard with jurisdiction stats, incident feed, jurisdiction map, nearby service counts, broadcast-modal UI, and incident resolve action. |
| `src/features/authority/pages/AuthorityIncidentsPage.jsx` | Incident queue page with polling/realtime refresh, list/map modes, filters, response-time/unit metrics, active/unassigned counts, and links to details. |
| `src/features/authority/pages/AuthorityIncidentDetailsPage.jsx` | Incident detail command page with polling and Socket.IO refresh, messages, staff actions, dispatch controls/links, tactical map, evidence area, expired-trip handling, and status/severity styling. |
| `src/features/authority/pages/AuthorityDispatchPage.jsx` | Fleet dispatch page. Loads units, assignable incidents, active dispatches, groups units by Police/Fire/Ambulance, and dispatches selected units to incidents. |
| `src/features/authority/pages/AuthorityRiskZonesPage.jsx` | Risk-zone admin page using Google Places/geocoding. Lists zones, creates circular danger zones, and activates/deactivates zones. |
| `src/features/authority/pages/AuthorityHazardsPage.jsx` | Hazard moderation page with status tabs and verify/reject/resolve actions. |
| `src/features/authority/pages/AuthorityRespondersPage.jsx` | Responder roster page with status icons, availability styling, workload details, and responder cards. |
| `src/features/authority/pages/AuthorityAnalyticsPage.jsx` | Analytics page for incident/status/severity/time trends and response-time summaries over the recent date range. |
| `src/features/authority/pages/AuthorityAccountCreationPage.jsx` | Disaster Management account creation for Police, Fire, and Ambulance/Hospital fleets, including Google geocoding, current-location capture, service type selection, and fixed base-location submission. |
| `src/features/emergency-services/api/emergencyServicesApi.js` | Emergency-service API wrapper for responder profile, current location update, own dispatches, tourist dispatches, dispatch tracking, dispatch location update, and dispatch status update. |
| `src/features/emergency-services/pages/ActiveDispatchPage.jsx` | Responder active-dispatch page with dispatch polling, geolocation watch, incident cards, timeline/progress flow, and status transitions from assigned through completed. |
| `src/features/emergency-services/pages/LiveTrackingPage.jsx` | Responder live tracking page using background context from `ResponderLayout`, fixed base marker, live unit location, incident destination, route summaries, and manual refresh. |
| `src/features/emergency-services/pages/DispatchHistoryPage.jsx` | Responder dispatch history with completed/cancelled filtering, search, metrics, table/mobile card layouts, and outcome badges. |
| `src/features/emergency-services/pages/SharedDispatchTrackingPage.jsx` | Shared dispatch tracking view for tourists or authority users. Polls tracking by dispatch ID and renders operational route map with base/current/destination markers. |

## API Boundary Summary

Feature pages should call feature API wrappers, not raw Axios directly, except for small legacy cases already present in source. Shared transport concerns belong in `src/services/apiClient.js` and `src/services/chatbotClient.js`.

The frontend calls these main backend domains:

- `/auth/*`
- `/tourists/*`
- `/dashboard/tourist`
- `/destinations`
- `/trips/*`
- `/groups/*`
- `/tracking/*`
- `/safety/*`
- `/alerts/*`
- `/sos`
- `/hazards/*`
- `/incidents/*`
- `/evidence`
- `/credentials/*`
- `/notifications/*`
- `/disaster-management/*`
- `/dispatch/*`
- `/risk-zones/*`
- `/analytics/*`
- `/emergency-services/*`
- `/admin/*`
- `/audit`
- `/observability/*`

Rakshak AI is separate from the main backend and is called through `VITE_AI_SERVICE_URL` at:

- `/api/v1/chatbot/messages`
- `/api/v1/chatbot/history`

## Realtime Boundary

`src/services/realtimeClient.js` creates sockets but does not auto-connect. Pages connect when they need live behavior. Current known consumers include:

- `CurrentTripPage.jsx` for blockchain credential integrity events.
- `AuthorityIncidentDetailsPage.jsx` and `AuthorityIncidentsPage.jsx` for dispatch refresh.

Responder tracking currently combines polling, browser geolocation, and API updates from `ResponderLayout`.

## Current Routes

| Route | Component |
| --- | --- |
| `/` | `HomePage` inside `PublicLayout` |
| `/login` | `LoginPage` inside `AuthLayout` |
| `/register` | `RegisterPage` inside `AuthLayout` |
| `/forgot-password` | `ForgotPasswordPage` inside `AuthLayout` |
| `/verify-email` | `VerifyEmailPage` inside `AuthLayout` |
| `/verify/:token` | `CredentialVerifyPage` |
| `/onboarding` | `OnboardingPage` through `OnboardingRoute` |
| `/tourist/dashboard` | `TouristDashboardPage` |
| `/tourist/tracking` | Tourist `LiveTrackingPage` |
| `/tourist/trips/create` | `CreateTripPage` |
| `/tourist/trips/ai-planner` | `AITripPlannerPage` |
| `/tourist/trips/current` | `CurrentTripPage` |
| `/tourist/trips/history` | `TripHistoryPage` |
| `/tourist/groups/create` | `CreateGroupPage` |
| `/tourist/groups/join` | `JoinGroupPage` |
| `/tourist/incidents/report` | `ReportIncidentPage` |
| `/tourist/incidents/history` | `IncidentHistoryPage` |
| `/tourist/checkins` | `TouristCheckinsPage` |
| `/tourist/profile` | `ProfilePage` |
| `/tourist/response/:dispatchId` | `SharedDispatchTrackingPage` |
| `/authority/dashboard` | `AuthorityDashboardPage` |
| `/authority/incidents` | `AuthorityIncidentsPage` |
| `/authority/incidents/:id` | `AuthorityIncidentDetailsPage` |
| `/authority/hazards` | `AuthorityHazardsPage` |
| `/authority/dispatch` | `AuthorityDispatchPage` |
| `/authority/zones` | `AuthorityRiskZonesPage` |
| `/authority/responders` | `AuthorityRespondersPage` |
| `/authority/accounts/create` | `AuthorityAccountCreationPage` |
| `/authority/analytics` | `AuthorityAnalyticsPage` |
| `/authority/response/:dispatchId` | `SharedDispatchTrackingPage` |
| `/admin/dashboard` | `AdminDashboardPage` |
| `/admin/locations` | `AdminLocationsPage` |
| `/admin/zones` | `AuthorityRiskZonesPage` reused for admin |
| `/admin/accounts` | `AdminAccountsPage` |
| `/admin/audit` | `AdminAuditPage` |
| `/responder/dispatch` | `ActiveDispatchPage` |
| `/responder/tracking` | Responder `LiveTrackingPage` |
| `/responder/history` | `DispatchHistoryPage` |
| `*` | `NotFoundPage` |

## Maintenance Rules

- Add new client features under `src/features/<domain>/` unless they are truly app-level infrastructure.
- Keep browser secrets out of `VITE_*` variables.
- Put reusable styling primitives in `src/components/ui/`; put shell-only controls in `src/app/components/`.
- Use Redux for authentication/client identity state.
- Use TanStack Query for server state, polling, mutations, and invalidation.
- Keep HTTP details in API wrappers and shared clients.
- Update this file whenever a client file is added, removed, renamed, or materially changes responsibility.
