# Realtime Events

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Socket.IO provides live application updates for authenticated clients. Realtime events complement persisted REST state for tracking, incidents, group/safety updates, dispatch and notifications.

Clients must reconnect by re-reading authoritative REST state and must clean up listeners to avoid duplicate event processing. Sensitive rooms/events must be authorized server-side.
