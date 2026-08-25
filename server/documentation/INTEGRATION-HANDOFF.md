# Integration Handoff

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Frontend team

Read:
1. `EMAIL-VERIFICATION.md`
2. `ENDPOINTS.md`
3. `ROLE-PERMISSIONS.md`
4. `REALTIME-EVENTS.md`
5. `ERROR-CATALOGUE.md`
6. `openapi.yaml`

Frontend must implement the signup verification UX: register -> OTP entry -> verify-email, expose resend after cooldown, and only enter the authenticated app after verification succeeds. Future normal login does not require OTP. Frontend also owns device GPS acquisition, UI state, access-token usage/refresh flow, multipart evidence upload, and Socket.IO reconnect/subscription behavior.

The tourist chatbot backend route is `POST /api/v1/chatbot/messages` and is restricted to authenticated tourist accounts. If `ChatbotWidget.jsx` is still simulated, wire it to that route rather than `/integrations/ai/risk-assessment` or `/integrations/ai/hazard-analysis`, which are staff-only analysis contracts. See `AI-CATALOGUE.md` for the provider boundary.

## AI team

Read `AI-CATALOGUE.md`. Staff risk assessment/hazard analysis and the tourist chatbot are intentionally separate provider contracts. The tourist route exists at `/api/v1/chatbot/messages`; supplying a production AI provider and wiring the frontend are separate integration tasks.

## Blockchain team

Read `BLOCKCHAIN-CATALOGUE.md`. Implement proof anchoring/verification, chain/RPC configuration, signing/key management, and stable provider output. Keep raw sensitive data off-chain.

## Notification providers

Read `NOTIFICATION-DELIVERY.md`. Implement EMAIL/SMS/PUSH/WHATSAPP handlers with normalized success/failure metadata.

## Operations

Read `ENVIRONMENT.md`, `DEPLOYMENT.md`, `TESTING.md`, and `FINAL-QA-CHECKLIST.md`.

Any contract-shape change should update validation, provider interface, tests, OpenAPI, and documentation together.

## Blockchain directory handoff

The API and blockchain project are separate runtimes. Start `blockchain/gateway/server.ts` from the blockchain directory and point `server/` to it using `BLOCKCHAIN_GATEWAY_URL`. Authentication is via `x-kavach-chain-key`; use the same secret on both sides and restrict the gateway to a private interface/network in deployment.

## Frontend handoff: emergency fleets

The Disaster Management UI can render three sections using the same dispatch API filtered/triggered by `POLICE`, `FIRE`, and `AMBULANCE`. The future service portal uses one registration/login surface with a service-type selector and browser geolocation feeding latitude/longitude. Tourist delivery-style movement should subscribe to the incident room and animate between successive `dispatch:updated` locations. See `EMERGENCY-SERVICE-DISPATCH.md`.
