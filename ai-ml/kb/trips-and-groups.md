# Trips and Groups

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Trips begin with destination, dates and SOLO/GROUP selection. Group membership is assembled before planning and then locked by the leader.

Planning is a one-time pre-start choice. Manual planning starts the trip immediately. AI planning uses the already selected destination/dates, saves the plan and starts the trip. Once ACTIVE, the trip cannot receive another AI plan. In group trips only the leader generates the plan; members can read the saved plan.
