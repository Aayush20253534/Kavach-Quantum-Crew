# AI/ML Data and Security Model

## 1. Trust boundaries

The AI layer is advisory. Authoritative identity, trip, emergency, responder, and blockchain state remains in the main KAVACH backend/PostgreSQL.

```text
Browser
  | access JWT
  v
Rakshak AI
  |                 \
  |                  \ Groq API
  +--> PostgreSQL      \
  +--> main KAVACH API  \

Main backend
  | server-to-server
  v
Python planner --> SerpAPI + Groq
```

## 2. Rakshak authentication

When configured for production, Rakshak validates the same HS256 access JWT as the main backend using matching secret, issuer, and audience. It additionally requires `payload.type === "access"`.

The authenticated `sub` claim becomes the only user ID used for:

- conversation ownership;
- visible history;
- private profile enrichment.

Request bodies cannot nominate another account ID.

## 3. CORS and request limiting

Rakshak uses an explicit comma-separated `CORS_ORIGINS` allow-list. Requests without an Origin header are permitted for non-browser/internal usage. Credentials are disabled in CORS because the chatbot uses bearer-token authentication rather than cross-site cookies.

The service applies:

- Helmet security headers;
- 32 KB JSON body limit;
- `express-rate-limit` using configurable window/max values;
- no `x-powered-by` header.

## 4. Chat persistence

The database stores conversation/message content, role, source labels, timestamps, and user linkage.

Clearing history hides old rows from the user/model via `hidden_before`; retained rows are not erased. Any privacy statement or retention policy should describe that behavior accurately.

## 5. Private profile minimization

The private-context query intentionally includes only fields useful for conversation.

### Included examples

- name/username;
- tourist nationality/preferred language;
- current planned/active trip destination/status/timing;
- group name/role/status;
- responder/disaster-management organization/jurisdiction metadata.

### Deliberately excluded

- password hashes;
- government identity numbers;
- medical history;
- password-reset/session tokens;
- emergency contacts;
- precise stored home/fleet coordinates;
- audit records.

The data is inserted into only the current authenticated model request. It is not copied into `kb/`.

## 6. Browser location

Browser coordinates may be sent to Rakshak for nearest-safe-zone questions. Rakshak forwards neither a privileged service token nor arbitrary identity. It calls the main safety API with the user's own bearer token, then performs distance calculations locally in the AI service.

The current chatbot code does not persist the `location` object as a separate location table. The user's natural-language message and assistant response are persisted as chat history.

## 7. Static KB safety

`kb/*.md` is shared grounding material. It must contain platform behavior, not user-specific secrets. Never put:

- access/refresh tokens;
- passwords;
- API keys;
- real user profiles;
- private incident details;
- precise private location history

into KB files.

## 8. Provider secrets

### Rakshak

`GROQ_API_KEY` exists only in the Rakshak runtime environment.

### Trip planner

`GROQ_API_KEY` and `SERPAPI_API_KEY` exist only in the Python service environment.

The browser receives generated output, not provider credentials.

## 9. Provider data exposure

Content included in a model request can be transmitted to the configured Groq provider. Therefore prompt construction is deliberately minimized. Do not expand `privateUserContext.ts` casually with sensitive fields.

SerpAPI receives destination/date search parameters required for place/hotel lookup, not authenticated KAVACH account credentials.

## 10. Operational action boundary

Rakshak's system prompt states that it must not claim an action occurred unless supplied context explicitly confirms it. Chat output must not be treated as evidence that an SOS, dispatch, incident transition, trip change, or blockchain transaction actually happened.

Application actions must continue through authenticated main-backend endpoints.

## 11. Failure handling

- Private-context lookup is best-effort and non-fatal.
- Safe-zone API lookup is best-effort and non-fatal.
- Missing static KB match is non-fatal.
- Missing Groq configuration blocks generation instead of silently fabricating a provider response.
- Planner hotel search failure is downgraded to a warning when the core itinerary is valid.

## 12. Logging

Current AI code logs provider/context failures to service logs. Avoid adding raw tokens, private database rows, complete provider responses containing user data, or secrets to logs.
