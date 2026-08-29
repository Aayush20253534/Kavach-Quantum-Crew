# Client Engineering Rules

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

1. Treat backend authorization/state as authoritative.
2. Do not expose server/provider/blockchain secrets in `VITE_*` variables.
3. Do not duplicate trip destination/date entry in the AI planner.
4. Group AI generation is leader-only.
5. Once a trip is ACTIVE, do not show AI generation/replanning controls.
6. Stop group join-request polling after group lock.
7. Preserve existing trip IDs when switching between planning and current-trip views; never create duplicate trips for an attached AI plan.
8. Keep realtime subscriptions and high-frequency GPS effects cleaned up on unmount.
9. Use API error codes/messages when available instead of generic failures.
10. Run lint/build before merging.
