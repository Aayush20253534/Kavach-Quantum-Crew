# Rakshak AI API

Base service exposes `/` and `/health` for service/readiness checks and authenticated chatbot routes under `/api/v1/chatbot`.

## Message

`POST /api/v1/chatbot/messages`

Requires a valid Kavach access JWT when `AI_REQUIRE_AUTH=true`. The request carries the user message and may include conversation/location context. The service persists the user message and assistant response under the authenticated user.

## History

`GET /api/v1/chatbot/history`

Returns the authenticated user's visible chat history.

`DELETE /api/v1/chatbot/history`

Clears the user's visible chat screen/history state without physically deleting the retained database history.

## Authentication

The service validates the same access-token issuer/audience/secret configuration as the main backend. A token issued for a different secret, issuer or audience is rejected even if the user just logged in.

## 2026-08-27 API behavior

For authenticated chatbot messages, account identity is taken from the verified access token. Any `context` supplied by the frontend is supplementary application context and must not override authenticated identity.

The successful message contract remains conversation-oriented; private user enrichment is internal prompt context and is intentionally not returned as a separate public API payload.

---

## Repository synchronization — 2026-08-27

The AI-facing contract should be treated as authenticated and user-scoped. Chatbot responses may use minimized profile/context fields for the signed-in user, but that context must never be cached or exposed across users. Live safety/fleet state should be obtained through backend-authorized APIs rather than inferred by the model.
