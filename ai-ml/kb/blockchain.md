# Blockchain in KAVACH

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

KAVACH uses a separate authenticated blockchain gateway. Trip/group credential state is anchored through `TrustAnchor.sol`; PostgreSQL remains the primary operational data store. The signer private key stays in the gateway runtime and is never exposed to the browser.

Blockchain anchoring is asynchronous and must not block SOS, tracking, incident response or emergency dispatch.
