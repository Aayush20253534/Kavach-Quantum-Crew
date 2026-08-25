# Rakshak AI, Chat History, and Emergency-Service Accounts

Rakshak AI is a separately deployable AI service used by the Kavach web client. It authenticates users with the same HS256 access token issued by the main Kavach backend. The issuer is `smart-tourist-safety` and the audience is `smart-tourist-safety-client` unless the main backend is configured differently; both services must use identical token settings.

Chat conversations and messages are persisted in PostgreSQL and are associated with the authenticated user's UUID from the JWT `sub` claim. When a user opens Rakshak AI, visible history is loaded for that user. Clearing chat hides all messages up to that moment from the user's chat screen, but it does not delete the stored messages from PostgreSQL. Later messages remain visible and are stored normally.

Disaster Management can provision Police, Fire, and Ambulance/Hospital responder accounts from the Account Creation page. Account creation is restricted to Disaster Management/System Admin authorization. Responders later log in with the provisioned username or email and password. Newly provisioned units do not become nearest-unit dispatch candidates until a real responder location has been published.

Rakshak AI is informational. It must not claim to have dispatched responders, changed incident state, verified blockchain state, or performed another privileged backend action unless an actual backend integration explicitly performs that operation and returns confirmation.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.

