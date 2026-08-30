# Emergency Response

KAVACH normalizes emergency events into the shared incident workflow. Incidents can originate from SOS, a valid tourist manual report, automatic safety escalation, group missing-person escalation, solo missing-person escalation, or other supported safety mechanisms.

Every incident presented to Disaster Management should carry the affected tourist's useful contact context, including name and phone number when available. The incident detail flow allows Disaster Management to contact the tourist and, when necessary, move into manual emergency-service dispatch.

SOS creates an urgent incident and notifies Disaster Management. Manual tourist reports are accepted only during an ACTIVE trip and are converted into normal incidents. Automatic signal-loss escalations also create normal incidents rather than a separate hidden queue.

Active incident queues contain operational states such as OPEN, ACKNOWLEDGED, and IN_PROGRESS. RESOLVED and DISMISSED incidents are terminal history and should not appear in the default active queue unless explicitly requested.

Police, Fire, and Ambulance/Hospital dispatches are operational records controlled by Disaster Management. For the solo missing-person flow, dispatch is deliberately manual after contact attempts; a tracking gap alone does not auto-send a fleet.

When a dispatch is assigned, the corresponding emergency-service account can receive a Mailjet notification and then use the fleet portal to accept/reject and update status. Live fleet tracking is handled by the main application, not by Rakshak AI.
