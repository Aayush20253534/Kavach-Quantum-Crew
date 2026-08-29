# Error Catalogue

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

API errors use structured codes/messages and an appropriate HTTP status. Important current cases include authentication/authorization errors, validation failures, trip-state conflicts, locked-group membership conflicts, unavailable AI planner errors, provider-not-configured errors and dispatch ownership/state conflicts.

Examples of stateful conflicts:
- `GROUP_MEMBERSHIP_LOCKED` when joins/approvals are attempted after group lock
- AI-plan attachment rejected once a trip is no longer `PLANNED`
- `AI_TRIP_PLANNER_*` errors for upstream misconfiguration, timeout, unavailability, rejection or invalid response

Do not leak Prisma, provider secrets or internal stack traces to clients.
