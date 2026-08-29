# Notification Delivery

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

KAVACH uses persisted in-app notifications/realtime events plus external delivery where configured. Transactional email is sent with the shared Mailjet client.

Emergency and dispatch email failures should be observable and retryable where workflow semantics require it, but they must not erase already-persisted incident/dispatch state.

Mailjet configuration is `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_SENDER_EMAIL`, `MAILJET_SENDER_NAME`.
