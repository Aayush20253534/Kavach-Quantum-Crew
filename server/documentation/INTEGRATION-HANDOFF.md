# Current integration handoff

Frontend: use Node API for trips/groups/tracking and stop group join polling after lock. Main backend: configure Mailjet, Upstash Redis, Google Places, AI service URLs and blockchain gateway. AI planner: deploy FastAPI separately with SerpAPI/Groq keys. Blockchain team: keep EVM signer/RPC only in gateway. Emergency fleet: use `/emergency-services` portal/location/status endpoints and Socket.IO for live updates.

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

## Frontend handoff: emergency email deep links

The frontend must support these protected destinations:

```text
/disaster-management/incidents/:incidentId
/emergency-services/dispatches/:dispatchId
```

Emergency emails point to `/login?redirect=<destination>&role=<role>`. Login must preserve the `redirect` query parameter. If a valid session already exists, skip the form and navigate directly. After successful authentication, navigate to the redirect destination only after validating that the authenticated role is allowed to open it.

For the current responder portal, one account represents one complete Police, Ambulance/Hospital, or Fire fleet. The expected primary tabs are Active Dispatch, Live Tracking, and Dispatch History. A separate Profile or per-vehicle Fleet UI is not required.

## Latest integration handoff

Frontend teams should treat responder dispatch, signal-loss cases, and group QR URLs as server-owned state. Do not re-create timers or derive dispatch authorization in the browser. The server owns the 5-minute/1-hour timing, responder assignment, QR signing, immutable-field enforcement, blockchain snapshot encryption, and database reconciliation.

Blockchain/gateway deployments must expose the latest snapshot append/read ABI before the main backend is rolled out.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## 2026-08-27 handoff sync

Frontend integration should treat the backend as authoritative for incident/dispatch state and account/base coordinates. Browser geolocation is live responder telemetry only. The responder UI may label a transition differently for operator clarity, but the payload must use supported backend status values.

AI integration must never accept a client-supplied account ID as the identity source for private context; use the verified token subject.

---

## Repository synchronization — 2026-08-27

Frontend handoff should assume persistent responder tracking in the layout, shared tourist dispatch-tracking access, sanitized application errors, OTP password reset, and trip-bound safety expiry. Integrators should use server route modules as the final endpoint/role contract.
