# Client API Usage

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

The client calls the main backend under `/api/v1`. Important groups include `/auth`, `/trips`, `/groups`, `/credentials`, `/tracking`, `/sos`, `/incidents`, `/notifications`, `/dashboard`, `/disaster-management`, `/dispatch`, `/emergency-services`, `/risk-zones`, `/admin` and `/chatbot`.

AI itinerary generation is requested through `POST /trips/ai-plan`; generated output is attached to an existing planned trip with `POST /trips/:tripId/ai-plan`. The browser does not call FastAPI directly.

Use `server/openapi.yaml` and route files for the exact current contract.
