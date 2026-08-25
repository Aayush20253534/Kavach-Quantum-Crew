# Rakshak AI Chatbot Runtime

The chatbot is deployed as a standalone TypeScript/Express service from `ai-ml/`. The browser calls it directly through `VITE_AI_SERVICE_URL`; Groq credentials never reach the frontend.

## Local run

```bash
cd ai-ml
cp .env.example .env
npm install
npm run dev
```

Health: `GET /health`
Chat: `POST /api/v1/chatbot/messages`

## Render

Create a new Web Service with repository root `ai-ml`.

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check: `/health`

Set `GROQ_API_KEY`, `CORS_ORIGINS`, and the other values from `ai-ml/.env.example`. If `AI_REQUIRE_AUTH=true`, copy `ACCESS_TOKEN_SECRET`, `JWT_ISSUER`, and `JWT_AUDIENCE` from the main backend so this service can validate the same access JWT. Never copy refresh-token, database, blockchain-wallet, or SMTP secrets into the AI service.

Then set the Vercel/frontend variable:

```env
VITE_AI_SERVICE_URL=https://your-ai-service.onrender.com
```

## Knowledge base

Files in `ai-ml/kb/*.md` and `*.txt` are scored using keyword overlap. The best matching full file is placed in the Groq system prompt. This is deliberately lightweight RAG: no vector database or embeddings.

Conversation history is persisted per authenticated user in PostgreSQL. Recent persisted messages are supplied back to the model as context. Clearing the visible chat does not physically delete retained history rows.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## Response routing

The chatbot must not treat KB retrieval as an allow/deny gate. A missing KB match still proceeds to Groq for normal conversation. When a KB file matches, its content is added as grounding for Kavach-specific questions.

Location-dependent questions use live platform context where implemented. `Nearest Safe Zone` calls the authenticated main Kavach safety-zone API using `KAVACH_API_URL`, calculates nearest configured safe zones from the browser coordinates, and gives those results to the model. Live platform context takes precedence over static KB text.

## Documentation map

For current deployment, API, KB maintenance and data-boundary details, also read `../README.md` and `../docs/architecture.md`, `../docs/api.md`, `../docs/deployment.md`, `../docs/knowledge-base.md`, and `../docs/data-and-security.md`.
