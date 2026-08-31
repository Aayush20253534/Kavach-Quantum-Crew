# Blockchain Integrity

KAVACH uses blockchain as a trust/integrity layer rather than as the main application database. PostgreSQL remains the source for operational users, trips, groups, incidents, and dispatches.

The blockchain gateway is a separate service that owns the RPC connection and issuer private key. The main backend talks to it using an internal API key. Tourists do not need wallets and the browser never receives the issuer private key.

Trip credentials use privacy-safe hashes for on-chain identity/status verification. The contract supports issuance, extension, revocation, and verification. Credential creation and blockchain submission are decoupled with background jobs so an RPC outage does not have to discard the successful application-domain operation.

The current implementation also supports append-only encrypted identity/group snapshots. The main backend canonicalizes and hashes a snapshot, encrypts the snapshot payload with an application encryption key, and queues it for the gateway. The smart contract stores the payload hash plus ciphertext and sequence. Integrity reconciliation can compare trusted snapshot data against PostgreSQL and restore supported fields when tampering is detected.

Credential verification combines the signed QR token, local credential/trip state, and blockchain status when a confirmed chain anchor is available.

Raw application secrets and blockchain issuer keys must never be exposed to the browser or Rakshak AI.
