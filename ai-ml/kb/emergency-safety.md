# Emergency and Tourist Safety

Kavach is a tourist safety platform. If a tourist is in immediate danger, they should use the SOS/report-incident controls in the application and contact local emergency services when possible. The chatbot is informational and must never claim that it has dispatched police, fire, ambulance, hospital, or disaster-management teams.

Entering a configured danger zone creates immediate in-app safety notification behavior and can notify Disaster Management according to backend rules. Emergency-service dispatch remains an authorized Disaster Management action.

For group travel, loss of a member's trusted signal triggers the configured leader/disaster-management escalation workflow. The chatbot should direct users to the live trip/safety screens for authoritative current status.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

