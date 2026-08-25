# AI Integration Catalogue

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Current status

The backend exposes two distinct AI boundaries:

1. **Staff integration contracts** under `/api/v1/integrations/ai/*` for risk assessment and hazard analysis. These are restricted to `DISASTER_MANAGER` and `SYSTEM_ADMIN` and return `501 INTEGRATION_PROVIDER_NOT_CONFIGURED` with the default provider.
2. **Tourist chatbot contract** at `POST /api/v1/chatbot/messages`. It is restricted to authenticated `TOURIST` accounts and returns `501 CHATBOT_PROVIDER_NOT_CONFIGURED` until a concrete chatbot provider is injected.

The frontend `ChatbotWidget.jsx` is wired to the standalone `ai-ml` chatbot service through `VITE_AI_SERVICE_URL`. The legacy main-backend chatbot contract may remain for compatibility, but the browser no longer uses the simulated local response.

## Endpoint summary

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/integrations/capabilities` | DISASTER_MANAGER / SYSTEM_ADMIN | Discover integration contract capabilities |
| `POST` | `/api/v1/integrations/ai/risk-assessment` | DISASTER_MANAGER / SYSTEM_ADMIN | Submit trip/location context for external risk scoring |
| `POST` | `/api/v1/integrations/ai/hazard-analysis` | DISASTER_MANAGER / SYSTEM_ADMIN | Submit hazard context for external classification/severity analysis |

These are **not chatbot endpoints**.

## Capability discovery

```http
GET /api/v1/integrations/capabilities
Authorization: Bearer <access-token>
```

Current response data advertises `riskAssessment: true`, `hazardAnalysis: true`, and `providerConfigured: false`.

## Risk Assessment

```http
POST /api/v1/integrations/ai/risk-assessment
Authorization: Bearer <access-token>
Content-Type: application/json
```

Validated request body:

```json
{
  "tripId": "UUID",
  "location": {
    "latitude": 25.4358,
    "longitude": 81.8463
  },
  "context": {}
}
```

Validation: `tripId` is a UUID, latitude is -90..90, longitude is -180..180, and `context` defaults to `{}`.

## Hazard Analysis

```http
POST /api/v1/integrations/ai/hazard-analysis
Authorization: Bearer <access-token>
Content-Type: application/json
```

Validated request body:

```json
{
  "hazardId": "optional UUID",
  "type": "LANDSLIDE",
  "description": "Rockfall near the route",
  "location": {
    "latitude": 25.4358,
    "longitude": 81.8463
  },
  "context": {}
}
```

Validation: `hazardId` is optional UUID, `type` is 2..80 chars, `description` is 1..2000 chars, coordinates are range-checked, and `context` defaults to `{}`.

## Current provider implementation

`server/src/modules/integrations/ai.provider.js` defines `riskAssessment(payload)` and `hazardAnalysis(payload)`. If an implementation is absent, the provider throws `INTEGRATION_PROVIDER_NOT_CONFIGURED`.

No Gemini, OpenAI, Groq, local LLM, RAG pipeline, or other inference provider is configured in this snapshot.

## Chatbot boundary

The standalone chatbot runtime is deployed from `ai-ml` and exposes `POST /api/v1/chatbot/messages`. The frontend calls that service directly using `VITE_AI_SERVICE_URL`. Groq is configured only on the AI service. Do not route tourist chat messages through staff-only risk/hazard endpoints.

## Emergency dispatch integration

Police/Fire/Ambulance nearest-unit selection is deterministic backend logic, not an AI decision. Any future AI incident classifier should output a recommended service type only; authorization and actual dispatch assignment remain in the disaster-management/dispatch backend.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

