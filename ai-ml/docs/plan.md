# AI/ML Feature Model and Extension Guide

This document describes the **current functional design** and how new AI capabilities should be added without turning the AI layer into an authority it does not own.

## 1. Current feature set

### Rakshak AI

Implemented capabilities:

- authenticated conversational chat;
- user-scoped persistent history;
- visible-history clearing without destructive deletion;
- static Markdown KB grounding;
- minimized role-aware private context;
- nearest-safe-zone live lookup;
- optional caller-provided application context;
- Groq generation with source labels.

### Python Trip Planner

Implemented capabilities:

- top-sight retrieval through SerpAPI;
- structured multi-day itinerary generation through Groq;
- source-data URL/thumbnail enrichment;
- hotel lookup and price-bucket selection;
- graceful hotel failure with itinerary preservation;
- public root/health endpoints.

## 2. Design rule: AI advises, backend authorizes

Any new feature should be classified first:

```text
Does it only explain/recommend/summarize?
  -> AI service can probably own generation.

Does it mutate trip, incident, group, dispatch, credential, or account state?
  -> main backend must own authorization and mutation.
```

For example, Rakshak may explain what an SOS does. It must not directly mark an incident resolved. The trip planner may generate an itinerary, but the main backend decides whether that plan may be attached to a trip.

## 3. Adding live chatbot context

Preferred pattern:

```text
identify a narrow intent
        |
require only the data needed
        |
call an authenticated main-backend read endpoint
        |
normalize/minimize returned data
        |
inject it as clearly labeled live context
        |
let Groq phrase the answer
```

Do not grant Rakshak a broad admin credential merely to simplify retrieval.

## 4. Adding private user context

Before adding a field to `privateUserContext.ts`, ask:

- Is this field necessary for the answer?
- Is it less sensitive than an alternative?
- Could the model accidentally expose it in unrelated conversation?
- Can it be obtained from an authenticated live endpoint instead?

Password, government-ID, medical, token, secret, and unrelated location-history fields should remain excluded.

## 5. Improving retrieval

The current lexical selector is intentionally simple. A future embeddings/vector implementation should preserve these invariants:

- per-document provenance;
- no private user data in shared index;
- bounded prompt context;
- deterministic fallback when retrieval is unavailable;
- live application state outranks stale static text.

## 6. Extending trip planning

Possible additions such as route optimization, budgets, accessibility preferences, weather, or opening hours should remain provider/data enrichments. Authorization still belongs in the main backend.

Any provider failure should be classified as:

- **core failure**: no valid itinerary can be produced;
- **supplemental failure**: return the valid core plan with warnings.

The current hotel behavior demonstrates the supplemental-failure pattern.

## 7. Testing expectations

For Rakshak, test:

- missing/invalid JWT;
- cross-user conversation ID rejection/new conversation behavior;
- message-length validation;
- history visibility boundaries;
- KB selection;
- location-required response;
- main-API safe-zone normalization;
- provider failure.

For the planner, test:

- request validation;
- exact day count;
- no invented places;
- enrichment from source metadata;
- hotel selection;
- hotel failure warning;
- provider errors.

## 8. Observability expectations

Log enough to identify dependency failures, but never log access tokens, provider keys, private profile dumps, or complete sensitive prompts. Track provider latency/error rate and main-backend context-call failures separately so operational issues can be isolated.
