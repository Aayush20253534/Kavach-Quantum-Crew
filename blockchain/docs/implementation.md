# Blockchain Implementation

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

The implementation consists of `TrustAnchor.sol`, deployment scripts, an ethers adapter and an HTTP gateway. Main-backend credential lifecycle events create asynchronous anchor work for issue/extend/revoke operations.

The gateway provides an isolated signer boundary and idempotent handling for already-applied operations. Application correctness must not depend on immediate chain finality.
