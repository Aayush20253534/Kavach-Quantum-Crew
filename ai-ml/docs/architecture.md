# AI/ML Architecture

## 1. Boundary overview

KAVACH separates conversational AI and itinerary generation because they have different callers, data requirements, and failure modes.

```text
                    +------------------------+
                    | React frontend         |
                    +-----------+------------+
                                |
              +-----------------+------------------+
              |                                    |
              v                                    v
+-----------------------------+      +-----------------------------+
| Rakshak AI                  |      | Main KAVACH backend         |
| TypeScript / Express        |      | Node.js / Express           |
| browser-facing              |      | authority for trip rules    |
+-------------+---------------+      +-------------+---------------+
              |                                    |
     +--------+---------+                          v
     |                  |             +-----------------------------+
     v                  v             | AI Trip Planner             |
PostgreSQL          Groq API          | Python / FastAPI            |
chat/profile            ^             +-------------+---------------+
     |                  |                           |
     +--> KB + live API-+                 +---------+---------+
                                             |               |
                                             v               v
                                          SerpAPI          Groq
```

## 2. Rakshak architectural layers

### HTTP/security layer

`server.ts` owns process-level concerns: Helmet, CORS, body-size restriction, request rate limiting, root/health routes, access JWT verification, router mounting, 404 handling, and generic error handling.

### Conversation layer

`chatRouter.ts` owns user-facing chatbot behavior. It requires an authenticated subject for history-backed conversation, validates the message, assembles context, sends it to Groq, and persists both sides of the exchange.

### Persistence layer

The AI service uses a small PostgreSQL schema independent of Prisma:

```text
ai_chat_conversations
    1
    |
    +----< ai_chat_messages

ai_chat_view_state
    keyed by user_id
```

The service creates these tables and indexes on startup through `ensureChatSchema()`.

### Retrieval layer

Static retrieval scans files in `KB_DIR`. The service reads the best-scoring document in full. This is intentionally simple and transparent.

### Live-context layer

`kavachContext.ts` is the bridge back to the main safety API. It currently supports active SAFE zone lookup with the caller's own bearer token. The AI service does not use a privileged backend token to bypass authorization.

### Private-context layer

`privateUserContext.ts` reads a minimized subset of account/trip data from PostgreSQL using the authenticated account ID. It is prompt-only private context and is never written into shared KB files.

### Provider layer

`groqClient.ts` is the only direct Groq HTTP client in Rakshak. Provider credentials remain server-side.

## 3. Prompt precedence

The system prompt instructs the model to reason in this order:

```text
live application context
        >
private authenticated-user context when relevant
        >
selected static KAVACH KB
        >
normal conversational knowledge
```

For KAVACH-specific facts unavailable in supplied sources, the model is instructed to say that it does not have the information rather than invent behavior.

## 4. Safe-zone sequence

```text
User: "nearest safe zone"
        |
        +--> intent regex matches
        |
        +--> coordinates present?
              | no -> return enable-location response
              v yes
        +--> bearer token present?
              |
              v
        GET main API /safety/zones?type=SAFE&active=true
              |
        normalize response shapes
              |
        validate coordinates
              |
        Haversine distance
              |
        nearest <= configured limit
              |
        inject into system prompt
              |
        Groq response
```

## 5. Trip-planner architecture

The Python planner is intentionally stateless. It receives one planning request and returns one plan payload.

```text
POST /api/trip/plan
        |
        +--> validate city / num_days
        +--> default check-in/check-out when omitted
        |
        v
build_trip_response()
        |
        +--> get_top_places(city)
        |       `--> SerpAPI top_sights
        |
        +--> generate_itinerary()
        |       `--> Groq structured JSON
        |             only provided place names
        |
        +--> enrich itinerary URL/thumbnail from SerpAPI source map
        |
        `--> get_hotels()
                `--> SerpAPI Google Hotels
                      |
                      v
                select_hotels()
                price buckets + rating selection
```

A hotel-provider failure produces `warnings` and an empty hotel set while preserving the itinerary. Failures in the core places/itinerary path can still produce a FastAPI error.

## 6. Authorization responsibility

The Python service does not decide whether a tourist may plan. The main backend checks trip status, trip ownership, group leadership, minimum group membership, and group lock before accepting/saving an AI plan.

This prevents a direct planner call from becoming an authorization bypass. FastAPI generates content; the main backend owns application policy.

## 7. Failure isolation

- Rakshak private-context failure -> continue without private enrichment.
- Rakshak safe-zone lookup failure -> continue without live safe-zone context.
- Missing KB match -> continue normally.
- Groq missing in Rakshak -> `501 CHATBOT_PROVIDER_NOT_CONFIGURED`.
- Trip-planner hotel lookup failure -> itinerary succeeds with warning.
- Main-backend-to-planner timeout/provider failure -> handled by backend proxy rather than exposing provider credentials to browser.

## 8. Non-responsibilities

Neither AI service should directly:

- mutate trips or groups;
- acknowledge/resolve incidents;
- create responder dispatches;
- sign blockchain transactions;
- send emergency email;
- determine legal identity validity;
- replace PostgreSQL as authoritative state.
