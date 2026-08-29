## Current KAVACH AI topology

KAVACH intentionally has two AI-related services with different responsibilities:

1. `ai-ml/` is **Rakshak AI**, a TypeScript/Express chatbot. It validates the same access JWT as the main backend when `AI_REQUIRE_AUTH=true`, retrieves relevant Markdown KB documents, loads bounded per-user history from PostgreSQL, optionally reads live KAVACH API context, calls Groq, and persists the conversation.
2. `ai-ml/trip-planner/` is a **Python FastAPI trip planner**. The main backend calls it server-to-server. It combines SerpAPI top sights, Groq structured itinerary generation, and SerpAPI hotel results. The browser never needs SerpAPI/Groq keys.

Neither service is the authoritative source for emergency status, trip ownership, group lock, dispatch status, or user identity. Those remain in the main backend/PostgreSQL.

# Rakshak AI Data and Security

## Authentication

Production should keep `AI_REQUIRE_AUTH=true`. The AI service validates Kavach access JWTs using the same access-token secret, issuer and audience as the main backend.

## Persistent history

Chat conversations/messages are stored per authenticated user in PostgreSQL. UI clear-history behavior hides previous messages from the user's active chat view but does not physically delete retained database history.

## Secrets

The AI service needs only secrets required for its own responsibilities. It must not receive the blockchain issuer private key, blockchain gateway key, snapshot encryption key, refresh-token secret, or unrelated email-provider credentials.

## Personal/location context

Only pass context needed to answer the current request. Location-aware answers should use current coordinates only when the browser/application supplies them and the corresponding backend capability requires them.

## Model boundary

Model output is advisory/informational. It does not directly mutate trips, incidents, responder dispatches or blockchain state.

## 2026-08-27 private-context policy

Rakshak AI may use a minimized profile for the **currently authenticated account only**. The lookup key is the verified JWT subject, never an arbitrary account ID in the request body.

Do not include password hashes, OTP/reset state, auth sessions, government ID numbers, medical history/documents, emergency contacts, audit records, or fixed precise account coordinates in model context. Conversation lookup and history mutation remain user-scoped. Private context may help answer self-referential questions but must not be volunteered unnecessarily or described as information available to other users.

---

## Repository synchronization — 2026-08-27

Private chatbot enrichment is user-scoped and minimized. Do not persist another user's profile or tracking context in shared prompts/caches. Emergency locations, dispatch tracking, credentials, and account data must be fetched through role-authorized backend endpoints.
