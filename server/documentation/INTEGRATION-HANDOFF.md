# Integration Handoff

## Frontend team

Read:
1. `ENDPOINTS.md`
2. `ROLE-PERMISSIONS.md`
3. `REALTIME-EVENTS.md`
4. `ERROR-CATALOGUE.md`
5. `openapi.yaml`

Frontend owns device GPS acquisition, UI state, access-token usage/refresh flow, multipart evidence upload, and Socket.IO reconnect/subscription behavior.

## AI team

Read `AI-CATALOGUE.md`. Implement providers for risk assessment and hazard analysis, and agree on a versioned response schema.

## Blockchain team

Read `BLOCKCHAIN-CATALOGUE.md`. Implement proof anchoring/verification, chain/RPC configuration, signing/key management, and stable provider output. Keep raw sensitive data off-chain.

## Notification providers

Read `NOTIFICATION-DELIVERY.md`. Implement EMAIL/SMS/PUSH/WHATSAPP handlers with normalized success/failure metadata.

## Operations

Read `ENVIRONMENT.md`, `DEPLOYMENT.md`, `TESTING.md`, and `FINAL-QA-CHECKLIST.md`.

Any contract-shape change should update validation, provider interface, tests, OpenAPI, and documentation together.
