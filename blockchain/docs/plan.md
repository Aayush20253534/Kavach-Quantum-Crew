# Blockchain Scope

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Current scope is trip/group credential anchoring, encrypted snapshots, lifecycle status and integrity verification. PostgreSQL remains authoritative for mutable operational data.

New blockchain work should preserve the isolated-signer boundary and avoid placing emergency-response availability on the chain critical path.
