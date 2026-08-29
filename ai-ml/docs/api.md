# Rakshak AI API

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

The active service is `ai-ml/server.ts`. Requests are authenticated with the same KAVACH access JWT used by the main backend when `AI_REQUIRE_AUTH=true`.

The service accepts user chat input, loads recent user-scoped conversation history, retrieves relevant Markdown knowledge and may call authenticated KAVACH live-context endpoints before Groq inference. Exact paths and request shapes should be taken from `server.ts`.

The Python trip planner is a separate API documented in `../trip-planner/README.md`.
