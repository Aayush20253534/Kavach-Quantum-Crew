# Rakshak AI Chatbot Runtime

Rakshak AI is the standalone TypeScript/Express service under `ai-ml/`. It provides conversational assistance around KAVACH while preserving the main backend as the source of truth for operational state.

## Runtime components

| File | Responsibility |
|---|---|
| `server.ts` | HTTP server, CORS, Helmet, rate limiting, JWT verification, health routes |
| `chatbot/chatRouter.ts` | message/history endpoints and prompt assembly |
| `chatbot/db.ts` | PostgreSQL pool and automatic chat-table creation |
| `chatbot/historyStore.ts` | conversation ownership, bounded history, persistence, visible-history clearing |
| `chatbot/kbSelector.ts` | static KB file scoring and selection |
| `chatbot/kavachContext.ts` | authenticated live safe-zone lookup and distance calculation |
| `chatbot/privateUserContext.ts` | minimized role-aware profile/trip context |
| `chatbot/groqClient.ts` | Groq HTTP completion call |
| `chatbot/types.ts` | request/response/provider types |

## Request lifecycle

```text
Browser
  |
  | POST /api/v1/chatbot/messages
  | Authorization: Bearer <access token>
  v
server.ts
  |
  +--> Helmet
  +--> CORS allow-list
  +--> JSON body limit: 32 KB
  +--> service-wide rate limiter
  `--> authenticateOptional()
          |
          | validates HS256 token when provided
          | validates issuer/audience/type=access
          v
chatRouter.ts
  |
  +--> require verified JWT subject
  +--> validate message and maximum length
  +--> ensure user-owned conversation
  +--> load private context
  +--> load bounded conversation history
  +--> select KB file
  +--> optionally load live safe zones
  +--> build system prompt
  +--> call Groq
  +--> save request + response
  `--> return conversationId/message/sources/actions
```

Even if `AI_REQUIRE_AUTH=false`, stored chat endpoints still require a verified user identity because the router requires `req.user.sub`. In production, `AI_REQUIRE_AUTH=true` is the intended configuration.

## JWT trust model

Rakshak verifies the same access token issued by the main backend. The values must match:

```env
ACCESS_TOKEN_SECRET=...
JWT_ISSUER=smart-tourist-safety
JWT_AUDIENCE=smart-tourist-safety-client
AI_REQUIRE_AUTH=true
```

Only the token subject is accepted as the account ID. The request body cannot choose a user ID.

## Conversation ownership

`ensureConversation(userId, conversationId)` accepts an existing conversation only when both its ID and `user_id` match. Otherwise a new UUID conversation is created. This prevents a guessed conversation UUID from crossing user boundaries.

The model receives only the most recent `CHATBOT_MAX_HISTORY` visible messages, capped at 50 even if configuration is larger.

## Clear-history semantics

Clearing history updates `ai_chat_view_state.hidden_before=now()`. Earlier rows remain retained, but:

- `GET /history` no longer returns them;
- `getConversationHistory()` no longer feeds them into Groq;
- future conversation context starts after the visibility boundary.

This is a hide-from-view/retention design, not a hard-delete operation.

## Knowledge grounding

The KB selector uses deterministic lexical matching. It does not use Chroma, embeddings, or semantic vector search in the current runtime.

The selected file is inserted into the system prompt as **Kavach knowledge-base document**. If no file is selected, the model can still answer normal conversation and use live/private context.

## Nearest-safe-zone behavior

Rakshak recognizes phrases such as:

- nearest safe zone
- closest safety zone
- safe zone near me
- find a safe zone

If browser coordinates are missing, the chatbot returns a direct request to enable location and does not call Groq for that turn.

With coordinates and a bearer token, it calls the main backend safety-zone endpoint, computes Haversine distances, sorts by nearest, and supplies up to three results by default to Groq.

A live lookup failure is non-fatal. The chatbot logs the lookup failure and continues without that live context.

## Private context behavior

Role-specific enrichment is fetched directly from PostgreSQL using the verified account ID:

- **TOURIST**: minimal identity/profile plus highest-priority ACTIVE or PLANNED trip and group relationship.
- **DISASTER_MANAGER**: identity plus organization/department/jurisdiction.
- **SYSTEM_ADMIN**: minimal identity.
- **POLICE/FIRE/AMBULANCE**: identity plus organization/jurisdiction/service type.

The lookup is best-effort. A database error in this enrichment is logged but does not block the chatbot request.

## Groq behavior

`groqClient.ts` calls the OpenAI-compatible Groq endpoint with:

- model from `GROQ_MODEL`;
- temperature `0.3`;
- 25-second request timeout;
- system + recent history + current user message.

Provider errors are surfaced to the router and returned through the service's standard error handling.

## Local development

```bash
cd ai-ml
cp .env.example .env
npm install
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm run build
npm start
```

Health endpoints:

```text
GET /
GET /health
```

Chat endpoint:

```text
POST /api/v1/chatbot/messages
```

## Production deployment

Build from `ai-ml/`:

```bash
npm ci
npm run build
npm start
```

Set the frontend variable to the deployed service root:

```env
VITE_AI_SERVICE_URL=https://<rakshak-service>
```

Do not place blockchain issuer keys, Mailjet secrets, SerpAPI keys, refresh-token secrets, or unrelated backend secrets in this service.
