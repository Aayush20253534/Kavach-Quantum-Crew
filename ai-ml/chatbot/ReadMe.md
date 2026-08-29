# Legacy Chatbot Notes

This directory is retained for compatibility with earlier chatbot work. The active Rakshak AI runtime entry point is `ai-ml/server.ts`, with current knowledge files under `ai-ml/kb/` and persistent chat state in PostgreSQL.

Do not build new integrations against legacy files here unless they are still imported by the current runtime. For deployment and environment configuration use `ai-ml/README.md` and `ai-ml/docs/deployment.md`.
