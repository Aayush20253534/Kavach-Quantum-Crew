# Emergency Service Dispatch UI

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Police, Fire and Ambulance use service-specific fleet portals backed by the unified emergency-service API. Core surfaces are Active Dispatch, Live Tracking and Dispatch History.

Assigned responders publish live GPS while handling a dispatch. The tourist/operations tracking response includes the responder's current location and destination context. Map routing/distance should be based on current responder position rather than the registered fleet-base location.
