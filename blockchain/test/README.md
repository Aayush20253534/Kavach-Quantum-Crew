# Blockchain Tests

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Run:

```bash
npm test
npm run build
```

Tests should cover contract access control, credential issue/extend/revoke behavior, snapshot/integrity semantics and gateway idempotency. Keep provider/network dependencies mocked or local where practical.
