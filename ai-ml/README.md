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
