# AI Integration Catalogue

## Current status

The backend currently exposes **two AI analysis contracts** plus capability discovery. It does **not** expose a general conversational chatbot endpoint.

All mounted integration routes pass through `authenticate`, and the service further restricts integration access to `DISASTER_MANAGER` and `SYSTEM_ADMIN`. A `TOURIST` cannot call these routes.

The default `aiProvider` has no concrete model implementation injected. Therefore the two AI POST endpoints return `501 INTEGRATION_PROVIDER_NOT_CONFIGURED` until a real provider is connected.

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

The tourist-facing `Rakshak AI` widget is separate. Currently, `frontend/src/components/chatbot/ChatbotWidget.jsx` keeps messages in component state and creates a simulated response with `setTimeout`. There is no `/chatbot`, `/chat`, `/assistant`, or tourist-accessible AI endpoint.

Do not wire the tourist chatbot directly to the staff-only risk/hazard routes. See `CHATBOT-INTEGRATION.md`.
