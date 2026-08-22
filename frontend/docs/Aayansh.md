# Frontend Implementation Plan (Aayansh)

## Purpose
This document serves as the implementation roadmap for integrating the newly available backend capabilities (OTP verification, GPS tracking, Map visualization, Geofencing, and Socket.IO real-time data) into the frontend architecture. It is designed so that a coding agent can read this plan and immediately know what to do next.

## Current Situation
- **Frontend Infrastructure**: React, Vite, Tailwind, Redux (Auth), TanStack Query (Server State), and basic routing/layouts are in place. Placeholders exist for most routes.
- **Available Backend Functionality**: 
  - SMTP-based OTP email verification.
  - HTTP endpoints for geofence (risk zones) fetching and location pings.
  - Basic backend flow setup.
  - A Socket.IO connection is exposed but currently states: *"Phase 0 exposes no location or incident events. Authenticated gateways are added later."*
- **Remaining Integration**: We must integrate tracking, map components, and socket management based on what the backend currently supports.

## Agent Responsibilities
- Define and implement frontend architecture, feature boundaries, and technical data flow.
- Safely manage GPS browser permissions and lifecycle.
- Integrate open source map providers (OpenStreetMap) decoupled from GPS logic.
- Integrate Socket.IO lifecycle and synchronization with TanStack Query.
- Wire up Redux for OTP and session authentication.

## Prachi Responsibilities (UI/UX)
- Design all visual components, layouts, maps, alerts, and notifications.
- All implementation must wait for or follow Prachi's UI/UX handoffs. Technical scaffolding can proceed, but visual decisions belong to Prachi.

---

## Backend Contract Checklist (To Verify Before Execution)
- `[ ]` **HTTP Contracts**: Check `ENDPOINTS.md` for exact paths for OTP, Tracking, and Geofence (Zones).
- `[ ]` **Socket URL**: Determine backend base URL (usually matches API base).
- `[ ]` **Socket Auth**: Confirm how tokens are passed (handshake query/auth object).
- `[ ]` **Events & Rooms**: Confirm with backend exactly what events are emitted for Phase 1. Currently missing/blocked.
- `[ ]` **Geofence Geometry**: Check response schema of `/api/v1/risk-zones` to see if it's standard GeoJSON or a custom polygon array.

> **⚠️ KNOWN BLOCKERS:**
> - Socket.IO authenticated gateways and specific real-time event names/payloads (for location, alerts, incidents) are currently **missing in the backend (Phase 0 only)**. Full real-time integration cannot be completed until these contracts are provided.

---

## Implementation Order

### Step 0 — Inspect and Verify Current Codebase
*Inspect first:* `src/services/apiClient.js`, `src/features/auth/store/authSlice.js`, `src/app/router.jsx`.
- `[ ]` Verify existing dependencies in `package.json`.
- `[ ]` Verify Axios interceptors and Redux flow.

### Step 1 — Complete Authentication Integration
*Inspect first:* `src/features/auth/pages/`
- `[ ]` Implement `/api/v1/auth/register` (Registration).
- `[ ]` Implement `/api/v1/auth/verify-email` (OTP Verification).
- `[ ]` Implement `/api/v1/auth/resend-verification` (Resend OTP).
- `[ ]` Connect successful verification to Redux `setAuth`.

### Step 2 — Core API Integration Foundation
*Modify only if needed:* Create hooks like `useRiskZones.js` in a generic `src/features/tracking/api/` or `src/features/safety/api/`.
- `[ ]` Create TanStack queries for fetching risk zones.
- `[ ]` Create TanStack mutations for location pings.

### Step 3 — Browser Location Foundation
*Inspect first:* Create `src/features/tracking/hooks/useGeolocation.js`.
- `[ ]` Implement permission flow (granted, denied, prompt).
- `[ ]` Implement continuous tracking (`navigator.geolocation.watchPosition`).
- `[ ]` Implement robust cleanup on unmount.

### Step 4 — Active Trip Location Tracking
*Modify only if needed:* Wire the geolocation hook to the tracking API mutation.
- `[ ]` Automatically send location to `/api/v1/tracking/pings` on an interval or distance threshold during active trips.

### Step 5 — OpenStreetMap Integration
*Inspect first:* Check for existing leaflet or react-leaflet dependencies. If missing, install only what is strictly necessary.
- `[ ]` Render a generic OpenStreetMap component.
- `[ ]` Keep map purely presentational (accepts location and polygons as props).

### Step 6 — Geofencing Integration
- `[ ]` Fetch geofences from `/api/v1/risk-zones`.
- `[ ]` Visualize polygons/circles on the map.
- `[ ]` Render backend-provided safety evaluations. **Do not write local intersection algorithms to determine critical safety.**

### Step 7 — Socket.IO Foundation (Blocked pending Backend Contracts)
*Inspect first:* Verify `socket.io-client` exists or install it. Create `src/features/realtime/socket/socketManager.js`.
- `[ ]` Implement connection lifecycle and auth handshake.
- `[ ]` Implement listener registration and cleanup.

### Step 8 — Real-Time Integration (Location, Alerts, Incidents, Notifications)
- `[ ]` Connect specific backend socket events to TanStack `queryClient.setQueryData()` or `invalidateQueries()`.
- `[ ]` Ensure no duplicate data or memory leaks.

### Step 9 — UI Integration & Final Verification
- `[ ]` Implement Prachi's approved UI designs for map, alerts, and OTP forms.
- `[ ]` Test edge cases (GPS denied, network failure, socket reconnect).
