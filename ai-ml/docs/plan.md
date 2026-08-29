# AI Services: Current Implementation and Extension Plan

This document distinguishes what exists now from possible future work. It is not a promise that unimplemented AI actions exist.

## Implemented service 1: Rakshak AI

Runtime: TypeScript/Node in `ai-ml/`.

Implemented responsibilities:

- authenticated chatbot endpoint,
- Groq inference,
- Markdown knowledge-base selection,
- bounded per-user conversation history in PostgreSQL,
- optional live context calls to the main KAVACH API,
- CORS/rate limits/auth configuration.

Rakshak does not own trip/incident/dispatch state and cannot bypass backend authorization.

## Implemented service 2: FastAPI trip planner

Runtime: Python/FastAPI in `ai-ml/trip-planner/`.

Implemented responsibilities:

- `GET /health`,
- `POST /api/trip/plan`,
- SerpAPI place discovery,
- Groq structured itinerary generation,
- SerpAPI hotel lookup,
- source URL/thumbnail enrichment,
- hotel failure degradation.

The main backend proxies this service through `/api/v1/trips/ai-plan`.

## Current planning product rule

Planning is one-time and pre-start only. Manual choice starts immediately. AI choice generates/saves and starts. A group plan can only be generated/saved by the trip owner/leader; members read the stored plan.

## Safety decision boundary

AI is not the emergency decision engine. Geofence/risk/check-in/signal-loss/SOS/dispatch workflows are deterministic backend features. Future AI risk-analysis providers may advise an operator but must not silently create facts or dispatch resources without explicit domain rules.

## Safe extension points

Future AI work should preserve:

1. server-side authentication/authorization,
2. strict schemas for model output,
3. explicit source provenance for externally retrieved data,
4. timeout/fallback behavior,
5. no provider secrets in the browser,
6. human/operator control for emergency decisions,
7. auditability of any AI-assisted recommendation used operationally.

## Testing expectations

- malformed model output is rejected,
- provider timeout is controlled,
- unavailable service has a manual/non-AI path where product flow allows,
- no cross-user chat history leakage,
- trip plan ownership/status checks remain in the main backend,
- hotel failure does not unnecessarily destroy a valid itinerary,
- AI cannot mutate emergency state by hallucinated instruction.
