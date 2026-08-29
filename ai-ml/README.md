# Rakshak AI

`ai-ml/` is the standalone authenticated chatbot service for KAVACH. It is a TypeScript/Express runtime using Groq inference, Markdown knowledge retrieval and PostgreSQL-backed per-user chat history.

It is separate from `ai-ml/trip-planner/`, which is the Python itinerary microservice.

## Run

```bash
cp .env.example .env
npm ci
npm run dev
```

Important variables include `DATABASE_URL`, `KAVACH_API_URL`, `GROQ_API_KEY`, `KB_DIR`, JWT settings and allowed origins. JWT issuer/audience/secret must match the main backend when `AI_REQUIRE_AUTH=true`.

Local main-backend URL should normally be:

```env
KAVACH_API_URL=http://localhost:4000/api/v1
```

## Behavior

- validates the KAVACH access token
- keeps chat history scoped to the authenticated user
- retrieves relevant content from `kb/`
- can use authenticated live KAVACH API context for supported features such as safe-zone lookup
- sends the composed context to Groq

See `docs/` for architecture, API, deployment and knowledge-base maintenance.
