# Backend Architecture

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

The backend follows module-oriented Express structure: route → validation/auth middleware → controller → service → repository/Prisma. Shared integrations live under `src/integrations`; jobs and realtime publishing are separate runtime concerns.

```text
client → Express API → service/repository → PostgreSQL
                    ├→ Socket.IO
                    ├→ Mailjet
                    ├→ FastAPI trip planner
                    ├→ blockchain gateway
                    ├→ Maps/Places
                    └→ Cloudinary / Upstash
```

All external provider secrets remain server-side. Operational state is persisted before asynchronous external work where appropriate.
