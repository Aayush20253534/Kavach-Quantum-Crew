# Blockchain Workflow

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

```text
create/update trip credential
  → persist DB credential
  → enqueue BlockchainAnchorJob
  → authenticated POST to gateway
  → gateway signs EVM transaction
  → TrustAnchor issue/extend/revoke
  → persist result / retry on transient failure
```

Group QR join is an application workflow, not direct blockchain membership mutation: scan → preview → request → leader approval → membership → individual credential issuance.
