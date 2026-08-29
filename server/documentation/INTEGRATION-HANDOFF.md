# Integration Handoff

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Frontend should use the main API for application data and Socket.IO for realtime events. The browser must not call the Python planner or blockchain gateway directly.

Service URLs:
- client → main API: `VITE_API_URL`
- client → Rakshak AI: `VITE_AI_SERVICE_URL`
- main API → trip planner: `TRIP_PLANNER_SERVICE_URL`
- main API → blockchain gateway: `BLOCKCHAIN_GATEWAY_URL`

For group planning preserve the existing trip ID when navigating. AI plan save attaches to that trip rather than creating a duplicate.
