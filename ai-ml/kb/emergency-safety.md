## Current safety principles

Deterministic backend safety checks take priority over generative AI. Risk/safety-zone reference data may be Redis cached briefly with invalidation, but live location/SOS/dispatch state is never treated as a long-lived cached chatbot fact. For immediate danger the chatbot should direct the user toward the KAVACH SOS/emergency workflow rather than attempting to diagnose or replace emergency services.

# Emergency and Tourist Safety

Kavach is a tourist safety platform. If a tourist is in immediate danger, they should use the SOS/report-incident controls in the application and contact local emergency services when possible. The chatbot is informational and must never claim that it has dispatched police, fire, ambulance, hospital, or disaster-management teams.

Entering a configured danger zone creates immediate in-app safety notification behavior and can notify Disaster Management according to backend rules. Emergency-service dispatch remains an authorized Disaster Management action.

For group travel, loss of a non-leader member's trusted signal for the default five-minute threshold creates the leader/disaster-management workflow. The leader gets a five-minute FALSE_ALARM / CONFIRMED_DANGER window. Confirmation or timeout escalates; if the member remains offline after a handled response, the leader is reminded again after five minutes with a fresh five-minute window. The chatbot should direct users to the live trip/safety screens for authoritative current status.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## Current implementation note — 2026-08-27

Trip-derived alerts are active only while the related trip remains active. Completing or cancelling a trip expires/clears its active safety state from current Tourist, Disaster Management, and System Admin active views.

For group signal loss, the leader gets the initial verification opportunity. Confirmed danger or no response after five minutes escalates urgently; a false alarm does not immediately become a Disaster Management incident.

---

## Repository synchronization — 2026-08-27

The knowledge-base entry remains source material for the authenticated Rakshak chatbot.

- Safety behavior includes SOS location capture, danger-zone entry/group-boundary detection, trip-bound alert expiry, signal-loss escalation, and incident ingestion into Disaster Management. A missing GPS fix must not be represented as `0,0`.

## Repository cross-check

This document describes the AI services. For implementation verification, follow imports/callers from the referenced files rather than treating prose as executable configuration. The repository-wide `README.md` describes deployment boundaries; `server/documentation/SYSTEM-FLOW.md` describes product flow; `server/documentation/TECHNICAL-FLOW.md` describes request execution; and `server/documentation/ENDPOINTS.md` lists the current REST surface.

### Operational assumptions

- PostgreSQL is the application source of truth.
- Redis is an optional fail-open cache for selected reads.
- Socket.IO transports realtime changes rather than replacing persistent state.
- Mailjet is the current transactional email provider.
- AI and blockchain integrations remain isolated behind server-side boundaries.
- Authorization and lifecycle rules are enforced on the backend even when the client hides an unavailable action.
