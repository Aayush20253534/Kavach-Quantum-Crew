# Frontend Functional Implementation Plan (Aayansh)

## Objective
The backend API is now fully mounted with 148 routes covering Authentication, Trips, Tracking, Geofencing, SOS, Incidents, and Disaster Management. The frontend UI shell is mostly designed by Prachi. 

This document was the **step-by-step master plan** to build out the functional logic, integrate TanStack Query + Axios, and wire the UI to the live backend.

> **Status: 100% COMPLETED** 🎉 (All 6 Phases have been successfully implemented and integrated).

---

## 🏗️ Phase 1: Authentication, OTP & Session Flow [COMPLETED]
*Target: Establish secure, persistent user sessions.*
1. **Axios Setup (`src/services/apiClient.js`)**: 
   - Add request interceptors to inject the Access Token.
   - Add response interceptors to catch `401 Unauthorized` and automatically call `/api/v1/auth/refresh` to rotate tokens.
2. **Auth Service (`src/features/auth/api/authService.js`)**:
   - Implement `login`, `register`, `verifyEmail` (OTP), `logout`, and `getMe`.
3. **Redux / App Init (`src/app/guards/AuthInitializer.jsx`)**:
   - On app mount, fetch `/api/v1/auth/me`. If successful, populate Redux store and grant access. If it fails, clear Redux and redirect to Login.
4. **Page Wiring**:
   - Hook up `LoginPage.jsx` to the login API.
   - Hook up `RegisterPage.jsx` to the register API.
   - Added `VerifyEmailPage.jsx` for OTP Verification.

---

## 👤 Phase 2: Tourist Onboarding & Profile [COMPLETED]
*Target: Allow tourists to complete their safety profile.*
1. **Profile Service (`src/features/profile/api/profileService.js`)**:
   - Implement `updateProfile` and `submitOnboarding`.
2. **Page Wiring**:
   - Hook up `OnboardingPage.jsx`. On submit, send data (Emergency Contacts, Medical Info) to `/api/v1/tourists/me/onboarding`.
   - Update Redux `user.onboardingComplete` to allow bypass of the onboarding guard.

---

## 🗺️ Phase 3: Trips, Groups, & QR Codes [COMPLETED]
*Target: Lifecycle of a tourist journey in Prayagraj.*
1. **Trip Hooks (`src/features/trips/api/tripQueries.js`)**:
   - TanStack `useMutation` for `/api/v1/trips` (Create).
   - TanStack `useQuery` for `/api/v1/trips/current` and `/api/v1/trips/history`.
2. **Group Hooks**:
   - `/api/v1/groups/join` (for QR code joining).
3. **Page Wiring**:
   - Wired `CreateTripPage.jsx`.
   - Wired `TripHistoryPage.jsx` and `CurrentTripPage.jsx`.
   - Wired `CreateGroupPage.jsx` to display a generated QR code from the backend invitation token.
   - Wired `JoinGroupPage.jsx`.

---

## 📍 Phase 4: Maps, Tracking & Geofencing [COMPLETED]
*Target: Live location tracking and risk zone visualization.*
1. **Map Component (`src/features/tracking/components/MapComponent.jsx`)**:
   - Installed `react-leaflet` and `leaflet`.
   - Render OpenStreetMap tiles and backend Risk Zones.
2. **Risk Zones API (`/api/v1/risk-zones`)**:
   - Fetch GeoJSON/polygons from the backend and render them on the Map as red/yellow/green overlays.
3. **Geolocation Hook (`useGeolocation.js`)**:
   - Use `navigator.geolocation.watchPosition` to track the user.
   - Pings backend silently on active trips.

---

## 🚨 Phase 5: SOS & Incidents [COMPLETED]
*Target: Emergency response features.*
1. **SOS Action**:
   - Connected the pulsing `SOSButton.jsx` to `POST /api/v1/sos`. Requires 3-second hold.
2. **Incident Reporting**:
   - Wired `ReportIncidentPage.jsx` to `POST /api/v1/hazards`.
   - Support multipart/form-data for image evidence (`/api/v1/evidence`).

---

## 🏢 Phase 6: Authority Command Center [COMPLETED]
*Target: Real-time dashboard for Disaster Management.*
1. **Authority API**:
   - Fetch global SOS alerts and all hazards.
2. **Dashboard Wiring**:
   - Wired `AuthorityDashboardPage.jsx` to display a global safety map, live SOS feeds, and hazard feeds.

---

## ⚙️ Technical Rules for Execution
- **State Segregation**: Use TanStack React Query for ALL server API calls. Use Redux ONLY for global synchronous UI state (like `auth.user` or theme).
- **Map Decoupling**: Keep map rendering visual-only. The GPS tracking logic must run in a separate hook so it works even if the map is closed.
- **Safety Authority**: Do not write local frontend code to calculate if a user is inside a danger zone. Send coordinates to `/api/v1/risk-zones/evaluate` and let the backend decide.
