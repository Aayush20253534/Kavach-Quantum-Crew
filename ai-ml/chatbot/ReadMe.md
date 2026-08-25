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

Conversation history is in memory and resets when Render restarts or a different instance handles the request.
