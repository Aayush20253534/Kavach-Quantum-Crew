## Current blockchain boundary

The main backend sends proof jobs to an authenticated gateway; the gateway owns the EVM signer and `TrustAnchor.sol` interaction. Raw tourist secrets/medical/location data should not be treated as public-chain content. Rakshak may explain proof/verification concepts but does not hold a wallet private key and cannot infer chain confirmation without integration data.

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

---

## Repository synchronization — 2026-08-27

The knowledge-base entry remains source material for the authenticated Rakshak chatbot.

- Blockchain integrity is eventually consistent: fresh database membership can temporarily precede the latest chain snapshot. Treat snapshot-unavailable/pending states separately from a confirmed mismatch, and do not auto-repair chain membership from database state while integrity evidence is incomplete.

## Repository cross-check

This document describes the AI services. For implementation verification, follow imports/callers from the referenced files rather than treating prose as executable configuration. The repository-wide `README.md` describes deployment boundaries; `server/documentation/SYSTEM-FLOW.md` describes product flow; `server/documentation/TECHNICAL-FLOW.md` describes request execution; and `server/documentation/ENDPOINTS.md` lists the current REST surface.

### Operational assumptions

- PostgreSQL is the application source of truth.
- Redis is an optional fail-open cache for selected reads.
- Socket.IO transports realtime changes rather than replacing persistent state.
- Mailjet is the current transactional email provider.
- AI and blockchain integrations remain isolated behind server-side boundaries.
- Authorization and lifecycle rules are enforced on the backend even when the client hides an unavailable action.
