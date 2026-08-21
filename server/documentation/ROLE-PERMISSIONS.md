# Role and Permission Matrix

This is a high-level matrix. Ownership, consent, lifecycle, and membership checks can further restrict an allowed role.

| Capability | TOURIST | DISASTER_MANAGER | SYSTEM_ADMIN |
|---|:---:|:---:|:---:|
| Self-register | Yes | No | No |
| Verify signup email with OTP | Yes | No | No |
| Resend own verification OTP | Yes | No | No |
| Login / refresh own account | Yes, after email verification | Yes | Yes |
| Manage own tourist profile | Yes | No | No |
| Create/manage own trip | Yes | No | No |
| Grant/withdraw trip consent | Yes | No | No |
| Issue own trip Safety ID | Yes | No | No |
| Create/join group trip | Yes | No | No |
| Submit consented location | Yes | No | No |
| View authorized group location | Yes | No | No |
| Schedule/complete own check-ins | Yes | No | No |
| View own safety alerts | Yes | No | No |
| Trigger SOS | Yes | No | No |
| View own/group incidents | Yes | No | No |
| View emergency incident queue | No | Yes | Yes |
| Acknowledge/start/resolve incidents | No | Yes | Yes |
| Self-assign incident | No | Yes | Yes |
| Assign another responder | No | No | Yes |
| Add staff incident notes | No | Yes | Yes |
| Incident conversation | Authorized participant | Yes | Yes |
| Report hazard | Yes | No | No |
| Moderate hazards | No | Yes | Yes |
| Manage risk zones | No | Yes | Yes |
| Create emergency units | No | No | Yes |
| Dispatch emergency units | No | Yes | Yes |
| Upload evidence | Authorized target | Yes | Yes |
| Delete evidence | Own upload | Own upload | Yes |
| Read own notifications | Yes | Yes | Yes |
| Enqueue/inspect delivery jobs | No | Yes | Yes |
| Process due delivery queue | No | No | Yes |
| View operational analytics | No | Yes | Yes |
| Use AI/blockchain contracts | No | Yes | Yes |
| Manage account status | No | No | Yes |
| Read audit API | No | No | Yes |
| Read observability API | No | No | Yes |

Authentication alone never grants arbitrary access to another user's resource.

## Email verification rule

`TOURIST` accounts are created unverified. Until `emailVerifiedAt` is populated, normal login/session use and authenticated Socket.IO access are blocked. Staff accounts are not enrolled through the public tourist OTP flow.
