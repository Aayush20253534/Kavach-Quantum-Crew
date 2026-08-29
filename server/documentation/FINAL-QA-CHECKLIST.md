# Release QA Checklist

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Before release verify:

- auth registration/login/refresh/logout and email OTP
- solo manual trip starts immediately
- solo AI plan saves then starts immediately
- group join/approval/lock works and locked groups stop join polling
- only leader can enter group AI generation flow; members can read saved plan
- active trips cannot attach/regenerate AI plans
- trip planner handles hotel-provider degradation without losing itinerary
- SOS and safety incidents have valid location
- fleet dispatch, responder GPS and tourist tracking work
- Mailjet sender/config works in production
- Socket.IO reconnects without duplicate listeners
- Prisma migrations deploy cleanly
- blockchain outage does not block emergency flow
- client lint/build and server/blockchain/AI checks pass
