## Current KAVACH AI topology

KAVACH intentionally has two AI-related services with different responsibilities:

1. `ai-ml/` is **Rakshak AI**, a TypeScript/Express chatbot. It validates the same access JWT as the main backend when `AI_REQUIRE_AUTH=true`, retrieves relevant Markdown KB documents, loads bounded per-user history from PostgreSQL, optionally reads live KAVACH API context, calls Groq, and persists the conversation.
2. `ai-ml/trip-planner/` is a **Python FastAPI trip planner**. The main backend calls it server-to-server. It combines SerpAPI top sights, Groq structured itinerary generation, and SerpAPI hotel results. The browser never needs SerpAPI/Groq keys.

Neither service is the authoritative source for emergency status, trip ownership, group lock, dispatch status, or user identity. Those remain in the main backend/PostgreSQL.

# Rakshak AI Knowledge Base

## Purpose

`ai-ml/kb/` contains concise operational truth used to ground Kavach-specific chatbot answers.

The current selector uses lightweight lexical/keyword scoring rather than embeddings or a vector database. The best relevant file is injected into the model context.

## Maintenance rule

Whenever backend behavior changes, update the corresponding KB file in the same change. Especially keep these facts synchronized:

- danger-zone notification recipients;
- signal-loss timing and leader actions;
- Disaster Management dispatch boundary;
- emergency-service live tracking;
- group QR behavior;
- blockchain individual/group snapshot contents and integrity states;
- chatbot history and account behavior.

A KB miss is not a refusal condition. Normal conversation still proceeds to Groq.

## Live versus static data

Static Markdown explains rules and architecture. It must not fabricate current locations, current incidents or current safe zones. Where implemented, those questions use authenticated live context from `KAVACH_API_URL`.

## 2026-08-27 knowledge-base boundary

Static KB files contain **shared KAVACH product behavior only**. Do not put tourist names, emails, phone numbers, IDs, trip-specific private data, fleet-account private details, or conversation-specific content into the KB.

Personalized answers should come from request-time authenticated context. This keeps static retrieval safe for reuse across users while still allowing Rakshak AI to understand the logged-in user's own role and current journey when appropriate.

---

## Repository synchronization — 2026-08-27

The KB now documents emergency response/live tracking, emergency safety, trips/groups, chatbot/accounts, and blockchain integrity behavior. Operational facts that change at runtime should still come from backend APIs; KB documents describe policy and workflow, not live state.
