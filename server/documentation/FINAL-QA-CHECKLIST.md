# Final Backend QA Checklist

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
