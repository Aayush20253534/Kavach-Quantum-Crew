# Rakshak AI Deployment

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Build and run as an independent Node service:

```bash
npm ci
npm run build
npm start
```

Set `DATABASE_URL`, `KAVACH_API_URL`, `GROQ_API_KEY`, `CORS_ORIGINS`, `AI_REQUIRE_AUTH=true`, and JWT settings matching the main backend. `KAVACH_API_URL` must include `/api/v1`.

The client uses `VITE_AI_SERVICE_URL` to reach this service.
