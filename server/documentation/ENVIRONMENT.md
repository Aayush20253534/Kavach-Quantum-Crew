# Environment Configuration

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Use `server/.env.example` as the canonical list. Major groups are application/HTTP, PostgreSQL, CORS/Socket.IO, JWT/cookies, Mailjet + OTP, Cloudinary, Google Maps, blockchain gateway, Upstash Redis and AI service URLs.

Production rules:
- randomize all secrets
- `TRUST_PROXY=true` behind Render
- secure refresh cookies for cross-site Vercel → Render deployment
- `TRIP_PLANNER_SERVICE_URL` and `BLOCKCHAIN_GATEWAY_URL` must be deployed service URLs
- Mailjet sender must be verified
- never expose backend secrets to the browser


## Redis

When `REDIS_ENABLED=true`, configure the existing Upstash REST URL/token plus these TTL controls:

```env
REDIS_DASHBOARD_TTL_SECONDS=30
REDIS_DESTINATIONS_TTL_SECONDS=900
REDIS_RISK_ZONES_TTL_SECONDS=30
REDIS_PLACES_TTL_SECONDS=21600
REDIS_ANALYTICS_TTL_SECONDS=20
```

The cache is an optimization only. Redis read/write failures fall back to the source of truth, and realtime operational state is not stored in this cache.
