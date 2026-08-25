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
