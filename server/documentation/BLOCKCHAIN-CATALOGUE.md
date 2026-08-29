# Blockchain Catalogue

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

The main backend talks only to the authenticated blockchain gateway. It does not hold the issuer private key. Credential and snapshot lifecycle work is persisted/retried asynchronously.

Key settings: `BLOCKCHAIN_ENABLED`, `BLOCKCHAIN_GATEWAY_URL`, `BLOCKCHAIN_GATEWAY_KEY`, `BLOCKCHAIN_DATA_ENCRYPTION_KEY`, contract version and worker settings.

Blockchain failures do not block SOS, tracking, incidents or emergency dispatch.
