# Emergency Safety

KAVACH monitors active trips using trusted location updates and configured safety rules. Safety zones and danger/risk zones are maintained by the main backend; Rakshak can explain them and can perform the implemented authenticated nearest-safe-zone lookup when browser coordinates are supplied.

For a GROUP trip, loss of a member's trusted location follows a leader-verification path. After the configured signal-loss threshold, the leader is notified and receives a response window. If the leader confirms danger or fails to respond during the response window, the situation escalates into a normal Disaster Management incident and Disaster Management is notified.

For a SOLO trip, the missing-person path is intentionally different. After approximately 10 minutes without trusted location, KAVACH sends the tourist a safety-check email and the Current Trip page asks the tourist to confirm whether they are safe. If the tourist confirms safety, the pending case clears. If the tourist asks for help, an incident is created immediately. If the tourist does not respond during the follow-up response window, a normal Disaster Management incident is created automatically.

A solo tracking-loss incident does not automatically dispatch Police, Fire, or Ambulance. Disaster Management receives the incident, can contact the tourist using the provided phone information, and decides whether to create a manual dispatch.

Manual incident reporting by a tourist is allowed only while that tourist is participating in an ACTIVE trip. A valid manual report creates a normal Incident so it participates in the same Disaster Management workflow as SOS and automatic safety incidents.
