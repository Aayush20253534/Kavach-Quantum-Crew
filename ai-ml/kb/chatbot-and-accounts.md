# Rakshak AI, Chat History, and Emergency-Service Accounts

Rakshak AI is a separately deployable AI service used by the Kavach web client. It authenticates users with the same HS256 access token issued by the main Kavach backend. The issuer is `smart-tourist-safety` and the audience is `smart-tourist-safety-client` unless the main backend is configured differently; both services must use identical token settings.

Chat conversations and messages are persisted in PostgreSQL and are associated with the authenticated user's UUID from the JWT `sub` claim. When a user opens Rakshak AI, visible history is loaded for that user. Clearing chat hides all messages up to that moment from the user's chat screen, but it does not delete the stored messages from PostgreSQL. Later messages remain visible and are stored normally.

Disaster Management can provision Police, Fire, and Ambulance/Hospital responder accounts from the Account Creation page. Account creation is restricted to Disaster Management/System Admin authorization. Responders later log in with the provisioned username or email and password. Newly provisioned units do not become nearest-unit dispatch candidates until a real responder location has been published.

Rakshak AI is informational. It must not claim to have dispatched responders, changed incident state, verified blockchain state, or performed another privileged backend action unless an actual backend integration explicitly performs that operation and returns confirmation.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## Rakshak AI response routing and live safety context

Rakshak AI does not require a knowledge-base match before it can answer. Greetings, introductions, thanks, and ordinary conversation are sent to the language model with the authenticated user's recent persisted conversation history even when no Markdown knowledge-base file matches the message.

For Kavach-specific questions, a matching knowledge-base document is supplied as grounding when available. The model is instructed not to invent Kavach behavior when neither static knowledge nor live application context contains the requested fact.

The **Nearest Safe Zone** request is a live-data operation. The browser sends the user's current location to the AI service. The AI service forwards the same authenticated access token to the main Kavach API and reads `GET /api/v1/safety/zones?type=SAFE&active=true`. It calculates distance to configured safe zones and gives the nearest live result to Rakshak AI as authoritative context. If browser location is unavailable, the chatbot asks the user to enable location access rather than guessing.

The AI Render service therefore needs `KAVACH_API_URL` set to the main backend API base URL including `/api/v1`, for example `https://your-backend.onrender.com/api/v1`.

## Current implementation note — 2026-08-27

Rakshak AI can understand the currently logged-in user's own basic account/role context when the authenticated runtime provides it. That context is private to the authenticated request and is not shared with other users or stored in the static knowledge base.

Emergency-service accounts have a fixed configured base location. Police uses a blue service identity, Ambulance/Hospital uses green, and Fire uses red in the responder interface.
