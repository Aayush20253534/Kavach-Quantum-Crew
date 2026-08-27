# Emergency Response and Live Tracking

Police, Fire and Ambulance/Hospital responder accounts have backend-integrated active dispatch, dispatch history and live tracking views. Disaster Management selects/assigns emergency services; incidents do not automatically dispatch these services merely because they were created.

Once a responder is assigned, live responder location can be visible from authorized tourist, Disaster Management and responder views. The chatbot can explain this workflow, but it cannot create or confirm a dispatch itself.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## Current implementation note — 2026-08-27

A responder's fixed fleet base and live response position are separate. The fixed base remains visible as a blue reference marker. During an active dispatch, the live responder GPS is the route origin, the tourist/incident is the destination, and the road route is shown as a black line. Police, Ambulance, and Fire retain blue, green, and red service accents respectively.

---

## Repository synchronization — 2026-08-27

The knowledge-base entry remains source material for the authenticated Rakshak chatbot.

- Current response context includes police/fire/ambulance dispatch status, shared tracking snapshots, responder base location, live responder GPS, road-route progress, and tourist-visible response tracking. Fleet tracking data must only be disclosed to the authorized tourist or staff roles allowed by the backend.
