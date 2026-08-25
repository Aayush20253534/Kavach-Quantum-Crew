# Chatbot Integration Guide

This document describes how the AI/RAG chatbot implementation is wired
into the backend behind the existing public contract:

```
POST /api/v1/chatbot/messages
```

It covers setup, environment variables, file structure, internal
architecture, and how to extend the knowledge base.

---

## 1. Overview

The chatbot answers user questions using a lightweight, embedding-free
retrieval approach:

1. A user message arrives at `POST /api/v1/chatbot/messages`.
2. The server inspects all files inside `kb/` and scores each one
   against the message using keyword/term overlap (no embeddings, no
   vector database, no chunking).
3. The single highest-scoring file's **full content** is loaded into
   the LLM context as the source of truth.
4. The last 10 messages of the conversation (per `conversationId`) are
   included for continuity.
5. The combined prompt is sent to **Groq** for a chat completion.
6. The response is returned in the existing API contract shape.

If no KB file scores above the relevance threshold, the endpoint
returns a graceful fallback message instead of calling the LLM.

---

## 2. File Structure

```
project-root/
├── kb/                          # knowledge base source files
│   ├── checkout-flow.md
│   ├── account-signup.md
│   └── refund-policy.md
│
├── src/
│   └── chat/                    # chatbot module (this integration)
│       ├── types.ts             # shared TypeScript types
│       ├── kbSelector.ts        # keyword-based KB file selection
│       ├── memoryStore.ts       # in-memory last-10-messages store
│       ├── groqClient.ts        # Groq API wrapper
│       └── chatRouter.ts        # Express router (mounted at /api)
│
├── .env                         # GROQ_API_KEY, GROQ_MODEL
├── package.json
├── tsconfig.json
└── server.ts                    # main server, mounts the router
```

---

## 3. Environment Variables

| Variable        | Required | Description                                                            |
|------------------|----------|--------------------------------------------------------------------------|
| `GROQ_API_KEY`   | Yes      | API key for Groq. Never exposed to the frontend.                       |
| `GROQ_MODEL`     | No       | Groq model name. Defaults to `llama-3.3-70b-versatile` if not set.     |

Example `.env`:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
```

If `GROQ_API_KEY` is missing, the endpoint returns:

```json
{
  "success": false,
  "message": "Chatbot provider is not configured",
  "code": "CHATBOT_PROVIDER_NOT_CONFIGURED"
}
```
with HTTP status `501`, matching the documented current backend behavior.

---

## 4. Mounting the Router

In `server.ts`:

```ts
import "dotenv/config";
import express from "express";
import chatbotRouter from "./chat/chatRouter";

const app = express();
app.use(express.json());

// Apply your existing auth middleware before this line if the route
// must be restricted to authenticated tourists.
app.use("/api", chatbotRouter);

app.listen(4000, () => console.log("Server running on port 4000"));
```

This resolves the full path to `/api/v1/chatbot/messages`, matching
the integration contract exactly.

> **Auth note:** This router does not perform token verification
> itself. Apply your existing auth middleware in front of it
> (e.g. `app.use("/api/v1/chatbot", authMiddleware, chatbotRouter)`)
> so only authenticated tourists can reach it.

---

## 5. Request Contract

```
POST /api/v1/chatbot/messages
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "message": "Is Sangam safe right now?",
  "conversationId": null,
  "location": {
    "latitude": 25.4358,
    "longitude": 81.8463
  },
  "context": {}
}
```

| Field             | Required | Notes                                                              |
|-------------------|----------|----------------------------------------------------------------------|
| `message`         | Yes      | The user's question.                                                |
| `conversationId`  | No       | Pass `null` to start a new conversation; otherwise reuse the ID returned by the previous response. |
| `location`        | No       | `{ latitude, longitude }`. Passed to the LLM only if present.       |
| `context`         | No       | Arbitrary structured context, passed to the LLM only if present.    |

---

## 6. Response Contract

### Success (200)

```json
{
  "success": true,
  "message": "Chatbot response",
  "data": {
    "conversationId": "generated-or-reused-uuid",
    "message": "AI-generated response here",
    "sources": ["tourist-safety-zones.md"],
    "suggestedActions": []
  }
}
```

- `data.message` — the assistant's reply. Frontend reads this from
  `response.data.data.message`.
- `data.conversationId` — must be stored by the frontend and sent
  back on the next request in the same conversation.
- `data.sources` — the KB file name used to answer, or `[]` if none
  was found relevant.
- `data.suggestedActions` — reserved for future use; always `[]`
  currently, since no suggested-action logic has been defined yet.

### No relevant KB file found (200)

```json
{
  "success": true,
  "message": "Chatbot response",
  "data": {
    "conversationId": "uuid",
    "message": "I couldn't find relevant information to answer that question.",
    "sources": [],
    "suggestedActions": []
  }
}
```

### Validation error (400)

```json
{
  "success": false,
  "message": "message is required",
  "code": "INVALID_REQUEST"
}
```

### Provider not configured (501)

```json
{
  "success": false,
  "message": "Chatbot provider is not configured",
  "code": "CHATBOT_PROVIDER_NOT_CONFIGURED"
}
```

### Internal error (500)

```json
{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_ERROR",
  "details": "..."
}
```

---

## 7. Conversation Memory

- Memory is **in-process and in-memory only** — stored in a `Map`
  keyed by `conversationId`. It resets whenever the server restarts.
- Only the **last 10 messages** (5 user + 5 assistant, or any mix) are
  kept per conversation. Older messages are silently dropped.
- If you need memory to survive restarts or scale across multiple
  server instances, this store must be swapped for a persistent
  backing store (e.g. Redis) — not included here, since it wasn't
  part of the original scope.

---

## 8. Knowledge Base File Selection

- Every file directly inside `kb/` is treated as a standalone,
  complete document (no chunking).
- On each request, the selector tokenizes the user's message and each
  KB file's content, then scores files by term-frequency overlap
  (plus a bonus if the query term appears in the filename itself).
- The single highest-scoring file is loaded **in full** into the LLM
  system prompt as the answer source.
- If no file clears the minimum relevance threshold
  (`MIN_SCORE_THRESHOLD` in `kbSelector.ts`), the endpoint responds
  with a fallback message and does not call the LLM.

### Adding new KB content

Just drop a new `.md` or `.txt` file into `kb/`. No re-indexing,
ingestion step, or build process is required — files are read live on
each request.

### Tuning relevance

If the wrong file is being selected, or "no relevant file" fires too
often, adjust `MIN_SCORE_THRESHOLD` and/or the `STOPWORDS` list in
`kbSelector.ts`.

---

## 9. Known Limitations (by design, per current scope)

- No embeddings or vector search — matching is keyword-based, so
  queries with no literal or near-literal term overlap with a KB file
  may fail to match even if a human would consider the file relevant.
- No cross-file synthesis — only one file's content is used per
  answer, even if the correct answer spans multiple documents.
- Conversation memory is not persisted or shared across server
  instances.
- `suggestedActions` is not populated by any logic yet.
- Auth is expected to be enforced by middleware outside this module.