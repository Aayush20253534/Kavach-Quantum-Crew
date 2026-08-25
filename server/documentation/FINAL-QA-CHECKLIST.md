# Final Backend QA Checklist

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


## Git
- [ ] Work is committed on `Backend`.
- [ ] `Backend` pushed.
- [ ] `Backend` merged into `dev`.
- [ ] `dev` pushed.

## Dependencies and DB
- [ ] `npm ci`
- [ ] `npm run prisma:generate`
- [ ] `npm run prisma:validate`
- [ ] `npm run prisma:migrate:deploy`
- [ ] `npx prisma migrate status`
- [ ] No failed migration remains.

## Quality
- [ ] `npm test`
- [ ] All suites pass.
- [ ] All tests pass.
- [ ] `npm run lint`
- [ ] Zero lint errors.
- [ ] `npm run format:check`

## API and security
- [ ] `/api/v1` responds.
- [ ] Health/readiness/database probes work.
- [ ] CORS is production allow-listed.
- [ ] JWT unsupported roles rejected.
- [ ] New tourist registration sends a real six-digit Gmail OTP.
- [ ] Registration does not issue a normal session before verification.
- [ ] Login/refresh/Socket.IO reject an unverified tourist.
- [ ] Correct OTP verifies email and issues the initial session.
- [ ] Wrong/expired/exhausted OTP behavior matches documented errors.
- [ ] Resend cooldown and replacement-code behavior work.
- [ ] Plaintext OTP is not stored in PostgreSQL.
- [ ] Changing tourist email resets verification.
- [ ] Sensitive route limits configured.
- [ ] Request-shape protections enabled.
- [ ] Evidence authorization/path-security tests pass.
- [ ] Secrets are not committed.

## Emergency flow
- [ ] Trip + consent + Safety ID lifecycle works.
- [ ] Tracking feeds safety evaluation.
- [ ] SOS creates critical incident.
- [ ] Staff response lifecycle works.
- [ ] Responder capacity rules work.
- [ ] Dispatch lifecycle works.
- [ ] Closed incidents lock new messages.
- [ ] Evidence remains access-controlled.

## Integrations
- [ ] AI provider fails closed when absent.
- [ ] Blockchain provider fails closed when absent.
- [ ] External notification providers fail safely when absent.

## Observability
- [ ] Request IDs correlate responses/logs.
- [ ] Audit API is admin-only.
- [ ] Metrics/diagnostics are admin-only.
- [ ] DB failure diagnostics do not leak raw errors.

## Documentation
- [ ] README describes the finished backend as a whole.
- [ ] Endpoint catalogue complete.
- [ ] System flow understandable to non-developers.
- [ ] Role matrix reviewed.
- [ ] AI/blockchain catalogues reviewed.
- [ ] Realtime/environment/testing/deployment docs reviewed.

## Emergency service QA additions

Verify Police/Fire/Ambulance registration and login role matching; nearest-unit selection with known coordinates; rejection when incident location is missing or no unit is available; unit location updates; service-owned dispatch authorization; status progression; tourist ownership checks; Socket.IO `dispatch:updated` delivery; migration deployment in Docker.

## Latest-flow QA additions

- [ ] Danger zone notifies tourist + Disaster Management, not responders.
- [ ] Signal loss uses a persisted 5-minute leader decision case and 5-minute reminders after a handled response.
- [ ] Responder email occurs only after dispatch assignment.
- [ ] Police/Fire/Ambulance pages use live backend data and browser GPS.
- [ ] Group QR is an HTTPS deep link readable by generic scanners.
- [ ] DOB is required before blockchain individual credential creation.
- [ ] Protected profile fields are locked during planned/active trip.
- [ ] Individual encrypted blockchain snapshot can be decrypted/verified.
- [ ] DB tamper simulation is restored from chain and audited.
- [ ] Group member join appends, rather than overwrites, snapshot history.
- [ ] Snapshot failure does not invalidate an otherwise confirmed credential.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

## Realtime blockchain integrity QA

- [ ] Fresh individual credential reaches `APPROVED`.
- [ ] Direct DB change to a protected individual field produces `TAMPERED -> FIXING -> FIXED -> APPROVED` without page refresh.
- [ ] Fresh group credential reaches `APPROVED`.
- [ ] Safe recoverable group-field tamper produces the same realtime lifecycle for active group members.
- [ ] Snapshot unreadable/hash mismatch never reports approval.
- [ ] New contract deployment is tested with fresh credentials; old-contract jobs are not mistaken for migrated state.
