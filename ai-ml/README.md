# KAVACH AI/ML Services

The `ai-ml/` workspace contains **two independent AI services** with different security boundaries and responsibilities:

1. **Rakshak AI chatbot**: TypeScript + Express, exposed to the browser through `VITE_AI_SERVICE_URL`.
2. **AI Trip Planner**: Python + FastAPI, called server-to-server by the main KAVACH backend.

They intentionally do not own trip state, group membership, emergency dispatch, incident status, authentication accounts, or blockchain state. Those remain authoritative in the main Node.js backend and PostgreSQL. The AI services consume selected information and produce advisory output.

## 1. Service topology

```text
React / Vercel
    |
    | Bearer access JWT
    v
Rakshak AI (:4200)
    |-- JWT verification
    |-- PostgreSQL chat history
    |-- Markdown KB retrieval
    |-- minimized authenticated-user context
    |-- optional live KAVACH context
    `-- Groq chat completion

React / Vercel
    |
    | POST /api/v1/trips/ai-plan
    v
Main KAVACH backend (:4000)
    |
    | server-to-server
    v
Python Trip Planner (:4300 / Render)
    |-- SerpAPI top sights
    |-- Groq structured itinerary
    `-- SerpAPI hotel search
```

## 2. Rakshak AI feature flow

A chatbot message follows this path:

```text
POST /api/v1/chatbot/messages
        |
        v
optional service auth middleware
        |
        v
verified JWT subject -> user identity
        |
        +--> create/reuse user-owned conversation
        +--> load bounded recent history
        +--> load minimized private user context
        +--> select best Markdown KB file
        +--> detect nearest-safe-zone intent
                |
                `--> call main KAVACH API with the same bearer token
                     and calculate nearest zones from browser coordinates
        |
        v
build grounded system prompt
        |
        v
Groq chat completion
        |
        +--> persist user message
        +--> persist assistant reply + source labels
        `--> return response to frontend
```

The chatbot is deliberately **not an action executor**. Its system prompt explicitly forbids it from claiming that it triggered SOS, dispatched a responder, changed a trip, or performed other application actions unless supplied context says that action actually happened.

## 3. Chat history

Rakshak persists chat history in PostgreSQL using:

- `ai_chat_conversations`
- `ai_chat_messages`
- `ai_chat_view_state`

History is scoped by the authenticated JWT subject. Supplying another user's conversation UUID does not grant access because conversation lookup also requires the matching `user_id`.

`DELETE /api/v1/chatbot/history` does **not physically delete audit history**. It moves the user's `hidden_before` timestamp so earlier messages disappear from visible history and are no longer provided to the model.

## 4. Static knowledge retrieval

The chatbot uses a small deterministic retrieval layer rather than embeddings or a vector database.

`kbSelector.ts`:

1. loads `.md` and `.txt` files from `KB_DIR`;
2. tokenizes the user's message;
3. removes common stopwords;
4. scores each knowledge file by token frequency;
5. adds a filename bonus when a token appears in the filename;
6. selects the single best file when its score reaches the minimum threshold;
7. injects the full selected file into the system prompt.

A missing KB match is **not a failure**. Normal conversation still proceeds to Groq.

## 5. Live KAVACH context

The current explicit live lookup is **nearest safe zone**.

When the message matches a nearest/closest safe-zone intent:

```text
message + browser latitude/longitude
        |
        v
Rakshak AI
        |
        | Authorization: Bearer <same access token>
        v
GET <KAVACH_API_URL>/safety/zones?type=SAFE&active=true
        |
        v
filter valid active SAFE zones
        |
        v
Haversine distance calculation
        |
        v
sort nearest first, keep top results
        |
        v
inject live results into system prompt
```

Live application context is treated as more authoritative than static KB text.

## 6. Private authenticated-user context

Rakshak can query the same PostgreSQL database for a deliberately minimized profile based on the verified JWT role.

Tourist context may include name, username, nationality, preferred language, current planned/active trip, destination, timing, and current group role/status. Disaster Manager context may include organization, department, and jurisdiction. Emergency-service context may include organization, jurisdiction, and service type.

The enrichment intentionally excludes password hashes, government IDs, medical history, reset/session tokens, emergency contacts, precise stored account/fleet coordinates, and audit records.

## 7. AI Trip Planner feature flow

The Python planner exposes:

- `GET /`
- `GET /health`
- `POST /api/trip/plan`

The frontend does not call it directly. The normal path is:

```text
selected destination + dates
        |
        v
main backend POST /api/v1/trips/ai-plan
        |
        v
Python POST /api/trip/plan
        |
        +--> SerpAPI top sights
        |
        +--> Groq JSON itinerary
        |      - exact requested day count
        |      - only supplied place names
        |      - 2-4 places/day
        |      - no repeats
        |
        +--> reattach URL/thumbnail from SerpAPI source data
        |
        `--> SerpAPI hotels
               |
               `--> pricing buckets + best-rated representative
```

Hotel lookup is supplemental. If hotel search fails, the planner still returns the usable itinerary and adds a warning instead of discarding the entire plan.

## 8. One-time trip planning rule

The authoritative planning rules live in the main backend, not in FastAPI:

- planning happens before trip start;
- `Plan without AI` starts without an AI plan;
- `Plan with AI` generates, saves, then starts the trip;
- an active trip cannot receive a new AI plan;
- group AI planning requires at least two active members and a locked group;
- group planning is leader-controlled while other members can view a saved plan.

The planner only generates itinerary data. It does not decide whether a user is allowed to generate/save it.

## 9. Environment boundaries

Rakshak requires its own Groq key, chat-history database connection, CORS configuration, and optionally the main backend access-token verification values. The Python planner requires SerpAPI and Groq credentials.

The browser must never receive `GROQ_API_KEY` or `SERPAPI_API_KEY`.

## 10. Documentation map

- `chatbot/ReadMe.md`: implementation walk-through of Rakshak.
- `docs/architecture.md`: component boundaries and end-to-end flows.
- `docs/api.md`: HTTP contracts.
- `docs/data-and-security.md`: authentication, privacy, storage, and failure boundaries.
- `docs/deployment.md`: local/production deployment.
- `docs/knowledge-base.md`: retrieval algorithm and KB maintenance.
- `docs/plan.md`: current feature model and safe extension rules.
- `trip-planner/README.md`: Python planner internals and response flow.
- `kb/*.md`: runtime grounding documents consumed by Rakshak.
