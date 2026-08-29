# Client Architecture

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

The client is a React/Vite single-page application organized under `src/app`, shared components/services and feature folders. It uses React Router, Redux Toolkit, TanStack Query, Axios and Socket.IO.

### Runtime boundaries

```text
React client
  ├→ main API (`VITE_API_URL`)
  ├→ Socket.IO (`VITE_SOCKET_URL`)
  └→ Rakshak AI (`VITE_AI_SERVICE_URL`)
```

The client never receives blockchain signer secrets and never calls the Python trip planner directly.

### Trip UX invariant

One destination/date form feeds both manual and AI planning. Group trips require join/approval + lock before planning. Manual choice starts immediately; AI save starts immediately. After activation, planning actions are hidden and backend state prevents re-planning.

### Emergency UX

Responder portals maintain assigned dispatch state and publish live location. Tourist tracking can combine group members with active responder tracking. Authorization always remains backend-enforced.
