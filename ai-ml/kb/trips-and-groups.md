# Trips and Groups

A KAVACH trip is created with a destination, start/end dates, and either SOLO or GROUP type. The destination is selected from the available destination choices rather than accepted as arbitrary free text in the trip-creation UI.

Planning is a one-time pre-start choice. A tourist can choose **Plan without AI**, which proceeds without an AI itinerary, or **Plan with AI**, which generates an itinerary through the Python trip-planner service, saves it to the planned trip, and then starts the trip. Once the trip is ACTIVE, a new AI plan cannot be attached.

For a SOLO trip, the tourist controls the planning choice.

For a GROUP trip, the group must have at least two active members and must be locked before planning or starting. The leader approves members and locks the group. Once locked, new joins/invitations/approvals are blocked. The leader controls AI plan generation; members can view the saved plan.

The normal group flow is:

```text
create group trip
-> share QR/join ID
-> member requests join
-> leader approves
-> at least 2 active members
-> leader locks group
-> planning becomes available
-> manual or AI planning
-> trip starts
```

The Trip Plan UI must not provide an alternate path around the group readiness requirement. Backend rules also reject AI-plan attachment or trip start when the group is not ready.

Trip state, group membership, group lock, and planning authorization come from the main KAVACH backend, not Rakshak AI or the Python planner.
