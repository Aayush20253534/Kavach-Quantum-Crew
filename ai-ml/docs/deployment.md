## Current KAVACH AI topology

KAVACH intentionally has two AI-related services with different responsibilities:

1. `ai-ml/` is **Rakshak AI**, a TypeScript/Express chatbot. It validates the same access JWT as the main backend when `AI_REQUIRE_AUTH=true`, retrieves relevant Markdown KB documents, loads bounded per-user history from PostgreSQL, optionally reads live KAVACH API context, calls Groq, and persists the conversation.
2. `ai-ml/trip-planner/` is a **Python FastAPI trip planner**. The main backend calls it server-to-server. It combines SerpAPI top sights, Groq structured itinerary generation, and SerpAPI hotel results. The browser never needs SerpAPI/Groq keys.

Neither service is the authoritative source for emergency status, trip ownership, group lock, dispatch status, or user identity. Those remain in the main backend/PostgreSQL.

# Rakshak AI Deployment

## Render

Deploy `ai-ml/` as its own Web Service.

```text
Build: npm install && npm run build
Start: npm start
Health: /health
```

## Required configuration

Use `.env.example` as the source of truth. Important variables include:

- `PORT`, `HOST`
- `DATABASE_URL`, `DB_POOL_MAX`
- `KAVACH_API_URL`
- `CORS_ORIGINS`
- `GROQ_API_KEY`, `GROQ_MODEL`
- `KB_DIR`
- `CHATBOT_MAX_HISTORY`, `CHATBOT_MAX_MESSAGE_LENGTH`
- `AI_REQUIRE_AUTH`
- `ACCESS_TOKEN_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`
- rate-limit values

`DATABASE_URL` should be a server-safe PostgreSQL connection string. Run `migrations/001_persistent_chat_history.sql` against the selected database before relying on persistent history.

The frontend receives only `VITE_AI_SERVICE_URL`. Never put Groq keys, DB URLs, JWT secrets, blockchain private keys or gateway keys into Vite environment variables.

## Main backend dependency

`KAVACH_API_URL` must include `/api/v1` and points to the normal Kavach backend. It is used only for approved live context. The AI service does not connect directly to the blockchain contract.

## 2026-08-27 deployment sync

The AI service requires database connectivity for persisted user-scoped history and private authenticated-context enrichment. Production authentication must use the same access-token issuer, audience, algorithm, and secret contract as the main backend.

After deployment, validate: authenticated history isolation, safe-zone live context, self-profile questions for each supported role, rejection of invalid/expired access tokens, and absence of sensitive fields in application logs/model context.

---

## Repository synchronization — 2026-08-27

Deployment must provide the configured AI provider credentials, backend origin, and CORS-safe frontend/backend URLs. The AI service must not bypass backend role checks for user, trip, incident, or emergency-response data.
