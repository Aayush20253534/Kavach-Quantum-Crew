# Rakshak AI Data and Security

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

- require KAVACH JWT authentication in production
- keep `ACCESS_TOKEN_SECRET`, Groq keys and database credentials server-side
- scope persisted conversations/messages by authenticated user
- forward access tokens only to trusted KAVACH backend endpoints that require user context
- do not treat Markdown retrieval as an authorization mechanism
- keep trip-planner provider keys isolated in the Python service
