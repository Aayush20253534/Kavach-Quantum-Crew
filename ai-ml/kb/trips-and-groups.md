# Trips, Groups, and Credentials

Tourists create trips in Kavach and can travel individually or in groups. During a planned or active trip, protected identity/contact fields used by the trip credential are not editable from the tourist profile.

Group QR codes use normal application links so they can be scanned using an ordinary QR scanner. A signed token in the link is still validated by Kavach before a member can join. Group membership changes are handled by the backend and important group history can be anchored as append-only blockchain snapshots.

The Current Trip screen is the authoritative place for the tourist's active trip, credential, group and emergency-response information.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## Current implementation note — 2026-08-27

Trip completion/cancellation closes the active monitoring lifecycle for that trip. Group-member signal-loss monitoring is meaningful only while the trip/group is operational, and stale active alerts should not survive trip end.
