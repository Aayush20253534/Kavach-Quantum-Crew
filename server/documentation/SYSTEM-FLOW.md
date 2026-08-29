# System Flow

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

```text
authenticated tourist
  → create trip
  → optional group creation/join/lock
  → choose planning mode once
  → start trip
  → live tracking + safety monitoring
  → SOS / incident / signal-loss escalation when needed
  → Disaster Management
  → emergency-fleet dispatch
  → responder live tracking
  → complete/cancel trip
```

AI planning, chatbot assistance, email delivery and blockchain anchoring are supporting services around this lifecycle. Emergency operation remains functional if AI or blockchain integrations are unavailable.
