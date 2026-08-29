# AI Catalogue

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

KAVACH has two AI services:

- **Rakshak AI (`ai-ml/`)**: authenticated chat, KB retrieval, Groq inference, persistent history and selected live KAVACH context.
- **Trip planner (`ai-ml/trip-planner/`)**: FastAPI itinerary/hotel service called server-to-server from `POST /api/v1/trips/ai-plan`.

Trip AI plans are stored on `Trip.aiPlan`. Attachment is allowed only while the trip is `PLANNED`. Group generation is a client/product leader-only flow; backend trip ownership and planned-state checks provide the security boundary.
