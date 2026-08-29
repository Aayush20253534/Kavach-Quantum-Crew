# Role Permissions

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Primary roles are `TOURIST`, `DISASTER_MANAGER`, `SYSTEM_ADMIN`, `POLICE`, `FIRE` and `AMBULANCE`.

Tourists own trip/group/safety workflows. Disaster Management handles operational incident/dispatch control. System Admin handles platform-wide administration. Fleet roles access only their permitted service/dispatch workflows.

Every sensitive route uses backend authentication/authorization middleware. UI visibility is not a permission check.
