## Current KAVACH AI topology

KAVACH intentionally has two AI-related services with different responsibilities:

1. `ai-ml/` is **Rakshak AI**, a TypeScript/Express chatbot. It validates the same access JWT as the main backend when `AI_REQUIRE_AUTH=true`, retrieves relevant Markdown KB documents, loads bounded per-user history from PostgreSQL, optionally reads live KAVACH API context, calls Groq, and persists the conversation.
2. `ai-ml/trip-planner/` is a **Python FastAPI trip planner**. The main backend calls it server-to-server. It combines SerpAPI top sights, Groq structured itinerary generation, and SerpAPI hotel results. The browser never needs SerpAPI/Groq keys.

Neither service is the authoritative source for emergency status, trip ownership, group lock, dispatch status, or user identity. Those remain in the main backend/PostgreSQL.

# Rakshak AI Service

Rakshak AI is Kavach's independently deployable TypeScript/Express chatbot service. It is intentionally separated from the main safety API and blockchain gateway.

## Runtime responsibilities

- validate Kavach access JWTs;
- accept tourist chatbot messages;
- persist per-user conversations/messages in PostgreSQL;
- retrieve relevant Markdown knowledge from `kb/`;
- obtain selected authenticated live context from the main Kavach API;
- call Groq for conversational generation;
- return Markdown-capable assistant responses to the React client.

It does **not** own trip state, geofencing, signal-loss escalation, responder dispatch, blockchain keys or blockchain reconciliation.

## Documentation

- `docs/architecture.md` - service boundaries and request flow
- `docs/api.md` - chatbot HTTP contract
- `docs/deployment.md` - Render/environment/database setup
- `docs/knowledge-base.md` - how KB retrieval works and how to maintain it
- `docs/data-and-security.md` - authentication, persistence and secret boundaries
- `docs/plan.md` - AI/ML roadmap and human-review principles
- `chatbot/ReadMe.md` - implementation-oriented chatbot notes

## Knowledge base

`kb/*.md` is runtime input, not decorative documentation. Keep it synchronized with actual Kavach behavior. Current KB topics include trips/groups, emergency safety, emergency response, blockchain integrity, chatbot/account behavior and live-context boundaries.

## Chat history

History is persisted user-wise in PostgreSQL. Clearing history from the UI hides the prior conversation for that user but does not physically erase the stored historical records. This is an application behavior and must be represented accurately in privacy/retention documentation.

## Development

```bash
npm install
npm run build
npm start
```

See `.env.example` before starting.

## 2026-08-27 Rakshak AI sync

Rakshak AI currently combines four context sources for an authenticated conversation:

1. recent history scoped to the authenticated user and conversation;
2. selected static KAVACH knowledge-base material;
3. live application context such as safe-zone lookup results;
4. minimized private authenticated-user context fetched from the verified account identity.

Private user context is not written into the shared knowledge base and is not treated as cross-user knowledge. Sensitive fields such as password hashes, password-reset/session tokens, government ID numbers, medical history, emergency contacts, and stored precise account coordinates are excluded from AI profile enrichment.

---

## Repository synchronization — 2026-08-27

Rakshak documentation is synchronized with the authenticated, user-scoped chatbot and current KAVACH safety/emergency workflows. Live operational facts should always be fetched through the backend authorization boundary.
