# Chatbot and Accounts

Rakshak AI is KAVACH's conversational assistant. It can explain system features, use selected knowledge-base material, remember recent visible chat history for the authenticated user, and use limited authenticated account context when useful.

Rakshak does not replace the main KAVACH backend. Account registration, login, OTP verification, password reset, trip mutations, incident actions, responder dispatch, and credential state are handled by normal authenticated application endpoints.

Chat history is stored per authenticated user. Clearing history hides older messages from the user's visible history and from future model context, but retained rows are not physically deleted by that action.

The chatbot may know a minimized subset of the signed-in user's profile. For tourists this can include basic identity preferences and the current planned/active trip/group relationship. For Disaster Managers and emergency-service users it can include organization/jurisdiction/service identity. Passwords, government IDs, medical data, session/reset tokens, emergency contacts, and unrelated precise stored coordinates are excluded from chatbot profile enrichment.

For live questions, current application context is more reliable than static documentation. The implemented example is nearest safe zone: Rakshak can use the user's browser coordinates, call the authenticated KAVACH safe-zone API, calculate distance, and explain the nearest configured safe zones.

Rakshak must not claim it performed an operational action merely because the user asked. A generated statement is not proof that SOS was triggered, a responder was dispatched, a trip was changed, or an incident was resolved.
