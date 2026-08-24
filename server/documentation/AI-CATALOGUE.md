# AI Integration Catalogue

> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Current status

The backend exposes two distinct AI boundaries:

1. **Staff integration contracts** under `/api/v1/integrations/ai/*` for risk assessment and hazard analysis. These are restricted to `DISASTER_MANAGER` and `SYSTEM_ADMIN` and return `501 INTEGRATION_PROVIDER_NOT_CONFIGURED` with the default provider.
2. **Tourist chatbot contract** at `POST /api/v1/chatbot/messages`. It is restricted to authenticated `TOURIST` accounts and returns `501 CHATBOT_PROVIDER_NOT_CONFIGURED` until a concrete chatbot provider is injected.

The current frontend `ChatbotWidget.jsx` has not yet been wired to the backend chatbot route and still creates a temporary simulated response locally.

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

The tourist-facing chatbot API is implemented at `POST /api/v1/chatbot/messages`, but the default provider is unconfigured. The frontend widget is still local/simulated, so end-to-end chatbot inference is not complete. Do not route tourist chat messages through staff-only risk/hazard endpoints.
