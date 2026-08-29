# Backend Deployment

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Typical production target is Render with PostgreSQL/Neon. Build should install dependencies, generate Prisma Client and deploy migrations before start.

Set `TRUST_PROXY=true`, production CORS origins, secure refresh-cookie settings, JWT secrets, Mailjet credentials and real URLs for the blockchain gateway, Rakshak AI and FastAPI trip planner.

Do not use `127.0.0.1` service URLs between separately deployed Render services.
