# Rakshak AI Architecture

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

```text
client → Rakshak AI Express service → PostgreSQL chat history
                         ├→ Markdown KB
                         ├→ main KAVACH API (selected live context)
                         └→ Groq
```

History and responses are scoped to the authenticated user. `KB_DIR` points at `ai-ml/kb/`. The service is independently deployable from both the main backend and the FastAPI trip planner.
