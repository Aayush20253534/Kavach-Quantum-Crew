# Emergency Service Dispatch

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Disaster Management/System Admin can provision Police, Fire and Ambulance service accounts. Dispatch selection uses service type, location/capacity/availability rules in the backend. Responder accounts authenticate normally, read assigned dispatches, publish live service/dispatch location and transition dispatch state.

Tourists can read authorized tracking for dispatches affecting them. Realtime state and email notifications complement, rather than replace, persisted dispatch records.
