# Testing

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Run the full backend suite with:

```bash
npm test
```

Additional unit/integration/e2e/security and targeted historical suites are exposed through `package.json`. The historical directory names remain for compatibility; new documentation should describe behavior by subsystem rather than by implementation phase.

Critical regression areas: auth/OTP, trip state transitions, group lock, AI-plan attach/start, signal loss, incident escalation, responder dispatch/tracking, Mailjet provider behavior, blockchain retries and authorization.
