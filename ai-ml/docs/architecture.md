## Current KAVACH AI topology

KAVACH intentionally has two AI-related services with different responsibilities:

1. `ai-ml/` is **Rakshak AI**, a TypeScript/Express chatbot. It validates the same access JWT as the main backend when `AI_REQUIRE_AUTH=true`, retrieves relevant Markdown KB documents, loads bounded per-user history from PostgreSQL, optionally reads live KAVACH API context, calls Groq, and persists the conversation.
2. `ai-ml/trip-planner/` is a **Python FastAPI trip planner**. The main backend calls it server-to-server. It combines SerpAPI top sights, Groq structured itinerary generation, and SerpAPI hotel results. The browser never needs SerpAPI/Groq keys.

Neither service is the authoritative source for emergency status, trip ownership, group lock, dispatch status, or user identity. Those remain in the main backend/PostgreSQL.

# Rakshak AI Architecture

## Request path

```text
React ChatbotWidget
  -> AI service /api/v1/chatbot/messages
  -> JWT authentication
  -> persisted recent user history
  -> live Kavach context when required
  -> Markdown KB selection
  -> Groq
  -> response + persisted message
```

The AI service is a separate deployment from `server/` and `blockchain/`.

## Boundaries

The main Kavach backend remains authoritative for users, trips, groups, geofences, alerts, incidents, notifications, emergency-service accounts and dispatch. The blockchain gateway remains authoritative for RPC/contract access. Rakshak AI may explain these systems or consume approved live API context, but it must not bypass their authorization or state machines.

## Grounding

Normal greetings and general conversation still go to the model when no KB file matches. Kavach-specific questions use the best matching Markdown knowledge. Location-sensitive functions such as nearest safe-zone lookup use authenticated live backend data where implemented, because static Markdown cannot tell a tourist what is near their current coordinates.

## Human control

AI does not auto-dispatch Police, Fire or Ambulance/Hospital. Danger-zone and signal-loss behavior are deterministic backend workflows. Disaster Management controls responder dispatch.

## 2026-08-27 architecture sync

The chatbot request path is now conceptually:

`verified JWT -> user-scoped conversation -> private user context -> optional live Kavach context -> KB selection -> system prompt -> Groq -> user-scoped history persistence`.

Private account enrichment is deliberately separated from KB selection. Shared KB files describe platform behavior; per-user data is resolved at request time and must not become shared knowledge.

---

## Repository synchronization — 2026-08-27

The current architecture uses the Node/Express backend as the authority boundary for authentication, account context, safety data, and emergency tracking. Rakshak may enrich answers with KB retrieval and provider completions, while authorization and private user context remain backend responsibilities.
