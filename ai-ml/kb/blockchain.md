# Blockchain Verification

Kavach uses its normal backend and PostgreSQL for real-time application state. Blockchain is a trust/integrity layer for selected trip credentials and encrypted snapshots.

The individual trip credential keeps an idHash and blockchain validity state. Selected trip identity/contact data can be stored as encrypted snapshot payloads with hashes so the backend can detect database mismatches and restore trusted snapshot values. The Current Trip UI may display blockchain verification or database-tamper/self-correction state.

Blockchain does not run live GPS tracking, notifications, signal-loss timers or emergency dispatch. A blockchain outage must not stop core emergency and tracking workflows.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

