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

## AI team

Read `AI-CATALOGUE.md`. Implement providers for risk assessment and hazard analysis, and agree on a versioned response schema.

## Blockchain team

Read `BLOCKCHAIN-CATALOGUE.md`. Implement proof anchoring/verification, chain/RPC configuration, signing/key management, and stable provider output. Keep raw sensitive data off-chain.

## Notification providers

Read `NOTIFICATION-DELIVERY.md`. Implement EMAIL/SMS/PUSH/WHATSAPP handlers with normalized success/failure metadata.

## Operations

Read `ENVIRONMENT.md`, `DEPLOYMENT.md`, `TESTING.md`, and `FINAL-QA-CHECKLIST.md`.

Any contract-shape change should update validation, provider interface, tests, OpenAPI, and documentation together.
