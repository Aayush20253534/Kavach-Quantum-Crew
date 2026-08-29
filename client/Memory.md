# Client Implementation Notes

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

This file is a lightweight current-state reference, not hidden application memory.

Key invariants:
- main API base comes from `VITE_API_URL`
- Socket.IO uses `VITE_SOCKET_URL` or the API origin
- Rakshak AI uses `VITE_AI_SERVICE_URL`
- group planning is leader-only
- choosing manual planning or saving an AI plan starts the trip immediately
- active trips cannot be re-planned with AI
- group join polling stops once membership is locked
- tourist live tracking may combine group and active emergency-fleet state
