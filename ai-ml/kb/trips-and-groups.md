## Current trip/group behavior supplied to Rakshak

- Destination/dates are entered once in the main Trips UI.
- Planning is one-time: manual choice starts immediately; AI choice saves then starts.
- AI planning cannot be added to an ACTIVE trip.
- Group leaders create/lock groups and are the only users who generate group AI plans.
- Members may view the persisted leader plan but cannot regenerate it.
- QR/direct joins create controlled membership requests; locked groups reject later joins.
- Live tracking requires the relevant consent and authorization; group visibility is not public.

The chatbot should explain these rules but must not claim it changed group/trip state unless the main KAVACH API actually confirms that action/state.

# Trips, Groups, and Credentials

Tourists create trips in Kavach and can travel individually or in groups. During a planned or active trip, protected identity/contact fields used by the trip credential are not editable from the tourist profile.

Group QR codes use normal application links so they can be scanned using an ordinary QR scanner. A signed token in the link is still validated by Kavach before a member can join. Group membership changes are handled by the backend and important group history can be anchored as append-only blockchain snapshots.

The Current Trip screen is the authoritative place for the tourist's active trip, credential, group and emergency-response information.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## Current implementation note — 2026-08-27

Trip completion/cancellation closes the active monitoring lifecycle for that trip. Group-member signal-loss monitoring is meaningful only while the trip/group is operational, and stale active alerts should not survive trip end.

---

## Repository synchronization — 2026-08-27

The knowledge-base entry remains source material for the authenticated Rakshak chatbot.

- Group Live Map uses trusted location pings, leader/member roles, per-member marker colors, consent-gated location sharing, and a 500 m group safety boundary. Ending or cancelling a trip invalidates trip-bound active alerts and tracking context.
