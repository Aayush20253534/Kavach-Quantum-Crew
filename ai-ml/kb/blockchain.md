# Blockchain Verification and Integrity

Kavach uses PostgreSQL for normal application state and Ethereum Sepolia as a trust/integrity layer.

Each individual or group trip credential has an `idHash` anchored in `TrustAnchor.sol`. The main backend can also append encrypted snapshots under that same `idHash`.

Individual snapshot type `1` protects: name, date of birth, trip destination, phone, email, and the trip/user/credential identifiers.

Group snapshot type `2` protects: group name, member count, destination, leader name/email/phone and identifiers. When a new member is accepted, a new append-only snapshot sequence records the updated count and the newly added member's ID/name/DOB/email/phone. Previous snapshots are not overwritten.

The API canonicalizes the snapshot JSON, SHA-256 hashes it, encrypts it using AES-256-GCM, and sends the hash plus ciphertext to the blockchain gateway. Plaintext PII is not directly stored in the Solidity fields.

A five-second integrity worker verifies both individual and group snapshots. The Current Trip UI can show CHECKING/APPROVED and, for recoverable tampering, TAMPERED -> FIXING -> FIXED -> APPROVED. INTEGRITY UNAVAILABLE means the credential can still be blockchain-confirmed but a trusted snapshot is not currently safe/readable enough for approval or repair.

Blockchain does not run GPS tracking, danger-zone calculations, signal-loss timers, email, chatbot history or responder dispatch. Those remain normal backend workflows.

## Current implementation note — 2026-08-27

Blockchain remains a trust/integrity subsystem rather than the source of live UI state. Operational incident, trip, fleet, and chatbot views use the application database/services; blockchain verification is used where a credential/integrity workflow explicitly calls for it.
