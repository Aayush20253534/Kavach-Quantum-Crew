# AI/ML HTTP API

This document covers the HTTP surface implemented by the two AI services.

# Rakshak AI

Base URL examples:

```text
local:      http://localhost:4200
production: https://<rakshak-service>
```

## `GET /`

Cheap liveness/information endpoint.

Example response:

```json
{
  "ok": true,
  "service": "kavach-ai-chatbot-service",
  "message": "Rakshak AI service is running",
  "status": "online",
  "health": "/health",
  "chatbot": "/api/v1/chatbot/messages"
}
```

## `GET /health`

Reports process health and whether Groq/auth configuration is present. It does not make a Groq request.

## `POST /api/v1/chatbot/messages`

### Authentication

Use the same KAVACH access JWT as the main backend:

```http
Authorization: Bearer <access-token>
```

The persisted chatbot route requires a verified JWT subject.

### Request

```json
{
  "message": "Where is the nearest safe zone?",
  "conversationId": null,
  "location": {
    "latitude": 25.43,
    "longitude": 81.84
  },
  "context": {
    "optionalFrontendContext": true
  }
}
```

`message` is required and bounded by `CHATBOT_MAX_MESSAGE_LENGTH` (default 2000 characters).

`conversationId` is optional. If it does not belong to the authenticated user, Rakshak creates a fresh conversation instead of attaching to another user's conversation.

`location` is needed for location-dependent live queries such as nearest safe zone.

### Success

```json
{
  "success": true,
  "message": "Chatbot response",
  "data": {
    "conversationId": "uuid",
    "message": "...",
    "sources": ["emergency-safety.md", "Kavach live safety zones"],
    "suggestedActions": []
  }
}
```

`sources` are source labels used for transparency; they are not URLs.

### Important errors

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `INVALID_REQUEST` | missing/empty message |
| 400 | `MESSAGE_TOO_LONG` | message exceeds configured limit |
| 401 | `AUTH_REQUIRED` | no verified account identity available |
| 401 | `INVALID_ACCESS_TOKEN` | bad/expired token |
| 501 | `CHATBOT_PROVIDER_NOT_CONFIGURED` | Groq key missing |
| 500 | `AI_SERVICE_ERROR` | unhandled service error |

## `GET /api/v1/chatbot/history`

Returns visible persisted history for the authenticated user.

Response data contains the latest visible `conversationId` and chronologically ordered messages.

## `DELETE /api/v1/chatbot/history`

Moves the caller's visibility boundary forward. It does not physically delete retained message rows.

# Python Trip Planner

Base URL examples:

```text
local:      http://localhost:4300
production: https://<trip-planner-service>
```

## `GET /`

Cheap service information endpoint suitable for Render/browser checks. It does not invoke SerpAPI or Groq.

## `GET /health`

Returns:

```json
{
  "ok": true,
  "service": "kavach-python-trip-planner",
  "serpapi_configured": true,
  "groq_configured": true
}
```

This checks environment presence, not provider reachability.

## `POST /api/trip/plan`

### Request

```json
{
  "city": "Prayagraj",
  "num_days": 3,
  "check_in": "2026-09-01",
  "check_out": "2026-09-04"
}
```

`num_days` must be greater than zero. Dates are optional at FastAPI level; omitted dates default to future values. In the integrated application the main backend supplies dates derived from the selected trip.

### Response

```json
{
  "itinerary": {
    "city": "Prayagraj",
    "days": [
      {
        "day": 1,
        "places": [
          {
            "name": "...",
            "start_time": "09:00",
            "end_time": "10:30",
            "url": "...",
            "thumbnail": "..."
          }
        ]
      }
    ]
  },
  "hotels": {
    "city": "Prayagraj",
    "hotels": []
  },
  "warnings": []
}
```

`warnings` is present only when supplemental work such as hotel lookup failed.

### Errors

- `502`: provider/domain `ValueError` surfaced by the planner.
- `500`: unexpected planning failure.

# Integrated frontend path

The browser normally **does not call `/api/trip/plan` directly**. It uses the main backend:

```text
POST /api/v1/trips/ai-plan
POST /api/v1/trips/:tripId/ai-plan
```

The first generates through FastAPI. The second attaches the generated plan to an authorized PLANNED trip. The main backend owns group readiness and one-time planning rules.
