# Technical Flow

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Request handling follows validation/auth middleware → controller → service → repository/Prisma. Socket.IO and jobs publish/advance state outside the direct request path where appropriate.

### Trip planning
`client → POST /trips/ai-plan → aiTripPlannerService → FastAPI → SerpAPI/Groq → client preview → POST /trips/:id/ai-plan → start trip`

### Group lock
`join requests → leader approvals → POST /groups/:id/lock → pending requests rejected → membership mutations blocked`

### Email
`domain service → sendMailjetEmail → Mailjet v3.1 → recipient`

### Blockchain
`domain event → anchor job → authenticated gateway → EVM`

### Emergency
`SOS/incident → DM workflow → dispatch record → responder API + Socket.IO → live GPS → tourist/operations tracking`
