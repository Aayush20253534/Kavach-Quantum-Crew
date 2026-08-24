# Integration Handoff

## Frontend team

Read:
1. `EMAIL-VERIFICATION.md`
2. `ENDPOINTS.md`
3. `ROLE-PERMISSIONS.md`
4. `REALTIME-EVENTS.md`
5. `ERROR-CATALOGUE.md`
6. `openapi.yaml`

Frontend must implement the signup verification UX: register -> OTP entry -> verify-email, expose resend after cooldown, and only enter the authenticated app after verification succeeds. Future normal login does not require OTP. Frontend also owns device GPS acquisition, UI state, access-token usage/refresh flow, multipart evidence upload, and Socket.IO reconnect/subscription behavior.

The current `ChatbotWidget.jsx` is UI-only and simulated. There is no tourist chatbot backend route yet. Do not connect it to `/integrations/ai/risk-assessment` or `/integrations/ai/hazard-analysis`; those routes are staff-only analysis contracts. Read `CHATBOT-INTEGRATION.md` before implementing chatbot networking.

## AI team

Read `AI-CATALOGUE.md` and `CHATBOT-INTEGRATION.md`. The mounted AI routes cover staff risk assessment and hazard analysis only. A tourist conversational assistant requires a separate backend contract; it does not currently exist.

## Blockchain team

Read `BLOCKCHAIN-CATALOGUE.md`. Implement proof anchoring/verification, chain/RPC configuration, signing/key management, and stable provider output. Keep raw sensitive data off-chain.

## Notification providers

Read `NOTIFICATION-DELIVERY.md`. Implement EMAIL/SMS/PUSH/WHATSAPP handlers with normalized success/failure metadata.

## Operations

Read `ENVIRONMENT.md`, `DEPLOYMENT.md`, `TESTING.md`, and `FINAL-QA-CHECKLIST.md`.

Any contract-shape change should update validation, provider interface, tests, OpenAPI, and documentation together.

## Blockchain directory handoff

The API and blockchain project are separate runtimes. Start `blockchain/gateway/server.ts` from the blockchain directory and point `server/` to it using `BLOCKCHAIN_GATEWAY_URL`. Authentication is via `x-kavach-chain-key`; use the same secret on both sides and restrict the gateway to a private interface/network in deployment.
