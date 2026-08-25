# Rakshak AI Architecture

## Request path

```text
React ChatbotWidget
  -> AI service /api/v1/chatbot/messages
  -> JWT authentication
  -> persisted recent user history
  -> live Kavach context when required
  -> Markdown KB selection
  -> Groq
  -> response + persisted message
```

The AI service is a separate deployment from `server/` and `blockchain/`.

## Boundaries

The main Kavach backend remains authoritative for users, trips, groups, geofences, alerts, incidents, notifications, emergency-service accounts and dispatch. The blockchain gateway remains authoritative for RPC/contract access. Rakshak AI may explain these systems or consume approved live API context, but it must not bypass their authorization or state machines.

## Grounding

Normal greetings and general conversation still go to the model when no KB file matches. Kavach-specific questions use the best matching Markdown knowledge. Location-sensitive functions such as nearest safe-zone lookup use authenticated live backend data where implemented, because static Markdown cannot tell a tourist what is near their current coordinates.

## Human control

AI does not auto-dispatch Police, Fire or Ambulance/Hospital. Danger-zone and signal-loss behavior are deterministic backend workflows. Disaster Management controls responder dispatch.
