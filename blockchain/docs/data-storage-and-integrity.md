# Blockchain Data Storage and Integrity

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

PostgreSQL is the system of record for application state. The EVM layer stores trust-anchor identifiers/status plus encrypted append-only snapshots and hashes used for integrity verification.

The main backend owns encryption material and anchor jobs; the gateway owns the signer. Integrity workers can compare DB state with the latest trusted snapshot and report/repair protected-field divergence according to backend rules.

Never place plaintext sensitive profile, medical or precise location data directly on a public chain.
