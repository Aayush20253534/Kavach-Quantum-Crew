# Blockchain Verification

Kavach uses its normal backend and PostgreSQL for real-time application state. Blockchain is a trust/integrity layer for selected trip credentials and encrypted snapshots.

The individual trip credential keeps an idHash and blockchain validity state. Selected trip identity/contact data can be stored as encrypted snapshot payloads with hashes so the backend can detect database mismatches and restore trusted snapshot values. The Current Trip UI may display blockchain verification or database-tamper/self-correction state.

Blockchain does not run live GPS tracking, notifications, signal-loss timers or emergency dispatch. A blockchain outage must not stop core emergency and tracking workflows.
