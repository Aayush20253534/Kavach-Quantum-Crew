# Database Overview

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Prisma/PostgreSQL is the primary application store. The schema includes users/sessions, tourist profiles, trips and consents, groups/members/invitations/join requests, credentials and blockchain jobs, tracking/safety data, SOS/incidents, notifications, risk/hazard data, responder services/dispatches and AI plan data.

`Trip.aiPlan` stores the generated itinerary payload. `TripGroup.isLocked`/`lockedAt` persist final membership lock state.

Use `server/prisma/schema.prisma` and migrations as the exact schema source.
