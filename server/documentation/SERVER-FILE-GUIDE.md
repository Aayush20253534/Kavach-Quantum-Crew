# Server File Guide

> **Purpose:** SIH-ready cheat sheet for explaining the backend repository file by file.
> Each entry intentionally uses simple language and stays within one or two short sentences.

## How to read the backend quickly

For most feature modules, remember this pattern:

```text
route -> middleware -> controller -> service -> repository -> PostgreSQL
```

- **Routes** decide which URL reaches a feature.
- **Middleware** checks authentication, permission and input before the feature runs.
- **Controllers** translate HTTP requests/responses.
- **Services** contain the actual business rules.
- **Repositories** contain Prisma/database queries.
- **Validation files** define allowed request data.

External systems such as Mailjet, Google Maps, AI and blockchain are kept under **integrations**, while recurring work is kept under **jobs** and live updates are under **realtime**.

## Folder map

| Folder | Simple meaning |
|---|---|
| `src/modules/` | Main backend features such as trips, groups, SOS, incidents and dispatch. |
| `src/common/` | Small helpers reused by many features. |
| `src/integrations/` | Code that talks to external services. |
| `src/jobs/` | Background/recurring safety and maintenance work. |
| `src/middleware/` | Checks that run around API requests. |
| `src/realtime/` | Socket.IO live updates. |
| `prisma/` | Database schema, migrations and seed data. |
| `tests/` | Automated tests. |
| `documentation/` | Human-readable backend documentation. |

---

## Root configuration & project files

- **`server/.dockerignore`**
  Lists files Docker should ignore while building the backend image. This keeps local secrets, dependencies and unnecessary files out of the image.

- **`server/.env.example`**
  Shows the environment variables the backend expects, using safe placeholder values. Developers copy this structure when configuring local or deployed environments.

- **`server/.gitignore`**
  Lists backend files Git should not track, such as secrets, generated files and local dependencies. It helps prevent accidental commits of machine-specific or sensitive data.

- **`server/.prettierignore`**
  Tells Prettier which backend files should not be auto-formatted. This avoids changing generated or special-format files.

- **`server/Architecture.ps1`**
  PowerShell helper related to viewing/generating the backend architecture structure. It is mainly a developer convenience script, not runtime application logic.

- **`server/Backend-architecture.txt`**
  Plain-text overview of the backend folder/module structure. It helps developers understand how the server is organized at a glance.

- **`server/Dockerfile`**
  Defines how to build the backend Docker image. It installs dependencies and starts the Node.js server in a reproducible container.

- **`server/README.md`**
  Main introduction to the backend: setup, architecture and how to run it. Start here when explaining or onboarding someone to the server.

- **`server/docker-compose.test.yml`**
  Defines containers/services needed for backend tests. It keeps the test environment separate from normal development services.

- **`server/docker-compose.yml`**
  Defines the backend development container setup and supporting services. It lets the project be started consistently with Docker Compose.

- **`server/eslint.config.js`**
  Configures ESLint rules for backend JavaScript. It catches common code-quality and style problems before runtime.

- **`server/jest.config.cjs`**
  Configures Jest: test locations, setup files and execution behavior. All backend automated tests use this configuration.

- **`server/openapi.yaml`**
  Machine-readable OpenAPI description of backend HTTP endpoints. It can be used to understand or generate API documentation/tools.

- **`server/package-lock.json`**
  Locks exact npm dependency versions used by the backend. It makes installs more reproducible across developer machines and deployments.

- **`server/package.json`**
  Lists backend dependencies, npm scripts and project metadata. Commands such as starting, testing and database tasks are defined here.

- **`server/prisma.config.ts`**
  Configures Prisma tooling for this backend. It tells Prisma how to work with the schema, database and migration setup.

## Existing backend documentation

- **`server/documentation/AI-CATALOGUE.md`**
  Explains how the backend connects to AI features and what AI-related capabilities exist.

- **`server/documentation/ARCHITECTURE.md`**
  Explains the backend architecture, layers and major modules in more detail.

- **`server/documentation/BLOCKCHAIN-CATALOGUE.md`**
  Summarizes blockchain-related backend features and where blockchain is used.

- **`server/documentation/DATABASE-OVERVIEW.md`**
  Explains the main database models and how important records relate to each other.

- **`server/documentation/DEPLOYMENT.md`**
  Explains how the backend is deployed and what production setup is required.

- **`server/documentation/Docker.md`**
  Explains the Docker setup and how to run the backend using containers.

- **`server/documentation/EMAIL-VERIFICATION.md`**
  Documents the email verification/OTP flow from request to verification.

- **`server/documentation/EMERGENCY-SERVICE-DISPATCH.md`**
  Explains how incidents are assigned to police, ambulance or fire services.

- **`server/documentation/ENDPOINTS.md`**
  Human-readable list of backend API endpoints and what each endpoint is used for.

- **`server/documentation/ENVIRONMENT.md`**
  Explains backend environment variables and what each configuration value controls.

- **`server/documentation/ERROR-CATALOGUE.md`**
  Lists important backend error codes/messages and what they mean.

- **`server/documentation/FINAL-QA-CHECKLIST.md`**
  Checklist used to verify important backend flows before a demo or release.

- **`server/documentation/INTEGRATION-HANDOFF.md`**
  Explains how the backend communicates with external/internal services and what those services expect.

- **`server/documentation/NOTIFICATION-DELIVERY.md`**
  Documents how in-app, email and other notification channels are delivered.

- **`server/documentation/REALTIME-EVENTS.md`**
  Lists Socket.IO events and explains which real-time updates they carry.

- **`server/documentation/ROLE-PERMISSIONS.md`**
  Explains what each role is allowed to access or perform.

- **`server/documentation/SERVER-FILE-GUIDE.md`**
  This guide. It gives a short, simple explanation of every file currently present under `server/`.

- **`server/documentation/SYSTEM-FLOW.md`**
  Explains complete user-facing backend flows in simple end-to-end order, including current safety and incident flows.

- **`server/documentation/TECHNICAL-FLOW.md`**
  Explains the same major workflows at implementation level: services, jobs, data and APIs involved.

- **`server/documentation/TESTING.md`**
  Explains the backend test strategy, test groups and how to run the tests.

## Prisma database schema & migrations

- **`server/prisma/migrations/.gitkeep`**
  Keeps the migrations folder present in Git even if migrations are temporarily absent.

- **`server/prisma/migrations/20260821070000_phase1_auth_tourist_profile/migration.sql`**
  Database migration for Phase1 Auth Tourist Profile. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821123000_merge_tourist_profile_split_staff_accounts/migration.sql`**
  Database migration for Merge Tourist Profile Split Staff Accounts. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821143000_phase4_trip_safety_id_consent/migration.sql`**
  Database migration for Phase4 Trip Safety Id Consent. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821160000_phase5_group_management/migration.sql`**
  Database migration for Phase5 Group Management. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821190000_phase7_safety_rules/migration.sql`**
  Database migration for Phase7 Safety Rules. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821210000_phase8_incident_sos/migration.sql`**
  Database migration for Phase8 Incident SOS. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821220000_phase9_notification_coordination/migration.sql`**
  Database migration for Phase9 Notification Coordination. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821230000_phase11_disaster_management/migration.sql`**
  Database migration for Phase11 Disaster Management. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821233000_phase12_hazard_reporting/migration.sql`**
  Database migration for Phase12 Hazard Reporting. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821234500_phase13_risk_zones_geofencing/migration.sql`**
  Database migration for Phase13 Risk Zones Geofencing. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260821235500_phase14_advanced_trip_monitoring/migration.sql`**
  Database migration for Phase14 Advanced Trip Monitoring. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260822000500_phase15_emergency_dispatch/migration.sql`**
  Database migration for Phase15 Emergency Dispatch. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260822001500_phase16_incident_communication/migration.sql`**
  Database migration for Phase16 Incident Communication. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260822002500_phase17_evidence_attachments/migration.sql`**
  Database migration for Phase17 Evidence Attachments. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260822004000_phase22_notification_delivery/migration.sql`**
  Database migration for Phase22 Notification Delivery. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260822011000_email_verification_otp/migration.sql`**
  Database migration for Email Verification Otp. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260822190000_expand_tourist_onboarding/migration.sql`**
  Database migration for Expand Tourist Onboarding. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260823041535_add_destination_model/migration.sql`**
  Database migration for Add Destination Model. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260823181500_add_government_id_type/migration.sql`**
  Database migration for Add Government Id Type. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260823190000_add_medical_document/migration.sql`**
  Database migration for Add Medical Document. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260824103000_blockchain_qr_credentials/migration.sql`**
  Database migration for Blockchain Qr Credentials. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260824170000_group_join_approval/migration.sql`**
  Database migration for Group Join Approval. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260825161000_emergency_service_dispatch/migration.sql`**
  Database migration for Emergency Service Dispatch. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260825224500_signal_loss_escalation/migration.sql`**
  Database migration for Signal Loss Escalation. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260825230000_blockchain_identity_snapshots/migration.sql`**
  Database migration for Blockchain Identity Snapshots. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260826000500_nullable_emergency_service_location/migration.sql`**
  Database migration for Nullable Emergency Service Location. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260827101500_password_reset_otp/migration.sql`**
  Database migration for Password Reset Otp. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260829154500_add_group_lock/migration.sql`**
  Database migration for Add Group Lock. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/20260829161000_add_trip_ai_plan/migration.sql`**
  Database migration for Add Trip Ai Plan. It contains the SQL changes needed to move an older database schema to this version.

- **`server/prisma/migrations/migration_lock.toml`**
  Prisma migration metadata that records the database provider used by the migration history.

- **`server/prisma/schema.prisma`**
  The main Prisma database schema. It defines backend tables/models, fields, relations, indexes and enums.

- **`server/prisma/seed.js`**
  Seeds initial/reference database data required for development or demos.

## Developer scripts

- **`server/scripts/create-system-admin.js`**
  CLI helper that creates a System Admin account safely in the database.

- **`server/scripts/generate-test-users.js`**
  Creates predictable user accounts used for testing/demo scenarios.

- **`server/scripts/seed-demo-data.js`**
  Adds demo-ready records so the project can be shown without manually creating every entity.

- **`server/scripts/verify-environment.js`**
  Checks that required environment configuration is present before running/deploying the backend.

## Local storage placeholder

- **`server/storage/temporary/.gitkeep`**
  Backend file related to Gitkeep. It supports the server implementation or project tooling.

## Shared common helpers

- **`server/src/common/cache/cache.js`**
  Provides the basic Redis cache helper functions used to read, write and remove cached values. It also handles cache failures without making Redis the source of truth.

- **`server/src/common/cache/domain-cache.js`**
  Groups cache keys by application domain and provides helpers to invalidate related cached data after writes.

- **`server/src/common/errors/ApiError.js`**
  Defines the standard application error object used by services/controllers. It keeps HTTP status codes and error codes consistent.

- **`server/src/common/responses/ApiResponse.js`**
  Defines the standard success-response shape returned by the API. It keeps API responses consistent across modules.

- **`server/src/common/utils/asyncHandler.js`**
  Wraps async Express handlers so rejected promises are forwarded to the central error handler instead of crashing or being forgotten.

- **`server/src/common/utils/dateTime.js`**
  Small date/time helper functions shared across backend features.

- **`server/src/common/utils/encryption.js`**
  Provides encryption/decryption helpers for sensitive backend data that must not be stored as plain text.

- **`server/src/common/utils/generateId.js`**
  Generates application IDs/identifiers in a consistent format.

- **`server/src/common/utils/geo.js`**
  Contains reusable geographic coordinate helpers used by location-based features.

- **`server/src/common/utils/geoDistance.js`**
  Calculates geographic distance between coordinates, used by tracking and safety checks.

- **`server/src/common/utils/geofence.js`**
  Contains reusable point/radius or geofence checks for deciding whether a location is inside a safety boundary.

- **`server/src/common/utils/hash.js`**
  Creates hashes for integrity, identifiers or comparison without storing the original value directly.

- **`server/src/common/utils/jwt.js`**
  Creates and verifies JWT tokens used for authenticated backend sessions.

- **`server/src/common/utils/pagination.js`**
  Builds consistent pagination values for list APIs such as page/limit/offset.

- **`server/src/common/utils/password.js`**
  Hashes passwords and verifies login passwords securely.

- **`server/src/common/utils/routeDistance.js`**
  Calculates/normalizes route distance information used by route and monitoring logic.

- **`server/src/common/validators/common.schema.js`**
  Contains Zod schemas reused by many modules for common request fields.

## Runtime configuration

- **`server/src/config/cors.js`**
  Defines which frontend origins and request methods are allowed to call the backend through CORS.

- **`server/src/config/database.js`**
  Creates/exports the Prisma database connection used by repositories.

- **`server/src/config/environment.js`**
  Reads and validates environment variables at startup so missing/invalid configuration fails clearly.

- **`server/src/config/googleMaps.js`**
  Loads Google Maps-related configuration used by map adapters.

- **`server/src/config/logger.js`**
  Creates the shared Pino logger used for structured backend logs.

- **`server/src/config/redis.js`**
  Creates/configures the Redis connection used for caching.

- **`server/src/config/security.js`**
  Central security-related configuration values used by middleware and authentication.

## Constants

- **`server/src/constants/alertSeverity.js`**
  Defines the allowed constant values for Alert Severity. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/dispatchStatus.js`**
  Defines the allowed constant values for Dispatch Status. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/emergencyTypes.js`**
  Defines the allowed constant values for Emergency Types. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/emergencyUnitStatus.js`**
  Defines the allowed constant values for Emergency Unit Status. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/emergencyUnitType.js`**
  Defines the allowed constant values for Emergency Unit Type. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/hazardSeverity.js`**
  Defines the allowed constant values for Hazard Severity. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/hazardStatus.js`**
  Defines the allowed constant values for Hazard Status. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/hazardTypes.js`**
  Defines the allowed constant values for Hazard Types. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/incidentStatus.js`**
  Defines the allowed constant values for Incident Status. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/permissions.js`**
  Defines the allowed constant values for Permissions. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/responderStatus.js`**
  Defines the allowed constant values for Responder Status. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/responderTypes.js`**
  Defines the allowed constant values for Responder Types. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/riskZoneGeometry.js`**
  Defines the allowed constant values for Risk Zone Geometry. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/roles.js`**
  Defines the allowed constant values for Roles. Keeping these values in one file prevents modules from using inconsistent strings/status names.

- **`server/src/constants/tripStatus.js`**
  Defines the allowed constant values for Trip Status. Keeping these values in one file prevents modules from using inconsistent strings/status names.

## External integrations

- **`server/src/integrations/ai/trip-planner.service.js`**
  Calls the separate Python FastAPI trip-planner service and returns its itinerary result to the main backend. It also handles planner timeouts/provider failures.

- **`server/src/integrations/blockchain/blockchain.integrity.service.js`**
  Compares trusted blockchain snapshots with current database data and supports integrity reconciliation when protected values differ.

- **`server/src/integrations/blockchain/blockchain.queue.js`**
  Queues blockchain work instead of making every user request wait for a chain transaction.

- **`server/src/integrations/blockchain/blockchain.service.js`**
  Main backend-facing blockchain service for credential and chain operations through the blockchain gateway.

- **`server/src/integrations/blockchain/blockchain.snapshot.js`**
  Builds, hashes and encrypts snapshot payloads before they are anchored through the blockchain flow.

- **`server/src/integrations/cloudinary/cloudinary.adapter.js`**
  Wraps Cloudinary upload/delete operations so application code does not depend directly on Cloudinary API details.

- **`server/src/integrations/disaster-feeds/disasterFeed.adapter.js`**
  Adapter for external disaster/risk feed data. It converts provider data into a form the backend can use.

- **`server/src/integrations/google-maps/directions.adapter.js`**
  Calls Google Maps directions/routes APIs to obtain route and distance information.

- **`server/src/integrations/google-maps/geocoding.adapter.js`**
  Converts addresses to coordinates or coordinates to readable locations through Google Maps geocoding.

- **`server/src/integrations/google-maps/googleMaps.client.js`**
  Shared low-level Google Maps HTTP client/config used by the individual Google Maps adapters.

- **`server/src/integrations/google-maps/places.adapter.js`**
  Queries Google Places for nearby places such as hospitals, police stations and fire stations.

- **`server/src/integrations/notifications/email.adapter.js`**
  General email adapter used by backend notification logic to send transactional messages.

- **`server/src/integrations/notifications/emergency-email.service.js`**
  Builds and sends emergency-specific emails such as incident, dispatch, signal-loss and group-separation notifications.

- **`server/src/integrations/notifications/mailjet.client.js`**
  Low-level Mailjet Send API v3.1 client. It sends transactional email through HTTPS using the Mailjet API credentials.

- **`server/src/integrations/notifications/push.adapter.js`**
  Provider boundary for push notifications. Application services use it without needing provider-specific details.

- **`server/src/integrations/notifications/sms.adapter.js`**
  Provider boundary for SMS delivery. It keeps SMS provider details outside business logic.

- **`server/src/integrations/storage/objectStorage.adapter.js`**
  Abstracts object/file storage operations used for uploaded evidence and documents.

## Background jobs

- **`server/src/jobs/blockchainAnchor.job.js`**
  Background worker that processes queued blockchain anchor/credential operations and updates their status after chain confirmation or failure.

- **`server/src/jobs/blockchainIntegrity.job.js`**
  Periodically checks protected database records against blockchain snapshots and performs supported integrity reconciliation.

- **`server/src/jobs/locationRetention.job.js`**
  Cleans or manages older location records according to the tracking retention rules.

- **`server/src/jobs/missedCheckIn.job.js`**
  Finds overdue tourist check-ins and triggers the required safety handling.

- **`server/src/jobs/safetyIdExpiry.job.js`**
  Finds expired safety IDs/credentials and updates their lifecycle state.

- **`server/src/jobs/signalLoss.job.js`**
  Runs the recurring signal-loss safety sweep, including solo loss and group safety/separation evaluation.

- **`server/src/jobs/staleLocation.job.js`**
  Detects location records that have become too old to be considered fresh/trusted.

- **`server/src/jobs/tripExpiry.job.js`**
  Handles trips whose allowed/end time has expired.

- **`server/src/jobs/tripLifecycle.job.js`**
  Runs recurring trip lifecycle checks such as start/end related state maintenance.

## Express middleware

- **`server/src/middleware/auditLog.middleware.js`**
  Records important authenticated API actions in the audit log for accountability and later review.

- **`server/src/middleware/authenticate.middleware.js`**
  Verifies the caller's authentication token/session and attaches the authenticated identity to the request.

- **`server/src/middleware/authorize.middleware.js`**
  Checks whether the authenticated role/permissions are allowed to use a protected endpoint.

- **`server/src/middleware/consentGuard.middleware.js`**
  Blocks protected actions when the required tourist consent is missing or invalid.

- **`server/src/middleware/errorHandler.middleware.js`**
  Central Express error handler that converts thrown application errors into consistent API responses.

- **`server/src/middleware/notFound.middleware.js`**
  Handles requests that match no backend route and returns the standard 404 response.

- **`server/src/middleware/observability.middleware.js`**
  Measures requests and records operational metrics such as response status and timing.

- **`server/src/middleware/rateLimiter.middleware.js`**
  Limits repeated requests to sensitive/high-volume endpoints to reduce abuse.

- **`server/src/middleware/requestId.middleware.js`**
  Adds a unique ID to each request so logs and errors from one request can be traced together.

- **`server/src/middleware/requestSecurity.middleware.js`**
  Applies extra request-security checks such as suspicious headers/body rules and privacy protections.

- **`server/src/middleware/upload.middleware.js`**
  Handles multipart/file uploads before evidence or document services process them.

- **`server/src/middleware/validate.middleware.js`**
  Runs Zod schemas against request body/query/params and rejects malformed input early.

## Feature modules

### `admin`

- **`server/src/modules/admin/admin.controller.js`**
  Receives HTTP requests for general admin operations and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/admin/admin.repository.js`**
  Contains Prisma/database queries for general admin operations. Other layers use it instead of writing database queries directly.

- **`server/src/modules/admin/admin.routes.js`**
  Defines the HTTP endpoints for general admin operations. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/admin/admin.service.js`**
  Contains the main business rules for general admin operations. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/admin/admin.validation.js`**
  Defines Zod request schemas for general admin operations. It rejects missing or invalid API input before business logic runs.

### `advisory`

- **`server/src/modules/advisory/advisory.controller.js`**
  Receives HTTP requests for travel and safety advisories and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/advisory/advisory.repository.js`**
  Contains Prisma/database queries for travel and safety advisories. Other layers use it instead of writing database queries directly.

- **`server/src/modules/advisory/advisory.routes.js`**
  Defines the HTTP endpoints for travel and safety advisories. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/advisory/advisory.service.js`**
  Contains the main business rules for travel and safety advisories. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/advisory/advisory.validation.js`**
  Defines Zod request schemas for travel and safety advisories. It rejects missing or invalid API input before business logic runs.

### `alert`

- **`server/src/modules/alert/alert.controller.js`**
  Receives HTTP requests for safety alerts and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/alert/alert.repository.js`**
  Contains Prisma/database queries for safety alerts. Other layers use it instead of writing database queries directly.

- **`server/src/modules/alert/alert.routes.js`**
  Defines the HTTP endpoints for safety alerts. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/alert/alert.service.js`**
  Contains the main business rules for safety alerts. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/alert/alert.validation.js`**
  Defines Zod request schemas for safety alerts. It rejects missing or invalid API input before business logic runs.

### `analytics`

- **`server/src/modules/analytics/analytics.controller.js`**
  Receives HTTP requests for dashboard and reporting analytics and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/analytics/analytics.repository.js`**
  Contains Prisma/database queries for dashboard and reporting analytics. Other layers use it instead of writing database queries directly.

- **`server/src/modules/analytics/analytics.routes.js`**
  Defines the HTTP endpoints for dashboard and reporting analytics. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/analytics/analytics.service.js`**
  Contains the main business rules for dashboard and reporting analytics. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/analytics/analytics.validation.js`**
  Defines Zod request schemas for dashboard and reporting analytics. It rejects missing or invalid API input before business logic runs.

### `audit`

- **`server/src/modules/audit/audit.controller.js`**
  Receives HTTP requests for audit-log viewing and filtering and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/audit/audit.repository.js`**
  Contains Prisma/database queries for audit-log viewing and filtering. Other layers use it instead of writing database queries directly.

- **`server/src/modules/audit/audit.routes.js`**
  Defines the HTTP endpoints for audit-log viewing and filtering. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/audit/audit.service.js`**
  Contains the main business rules for audit-log viewing and filtering. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/audit/audit.validation.js`**
  Defines Zod request schemas for audit-log viewing and filtering. It rejects missing or invalid API input before business logic runs.

### `auth`

- **`server/src/modules/auth/auth.controller.js`**
  Receives HTTP requests for login, registration, OTP and authentication and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/auth/auth.repository.js`**
  Contains Prisma/database queries for login, registration, OTP and authentication. Other layers use it instead of writing database queries directly.

- **`server/src/modules/auth/auth.routes.js`**
  Defines the HTTP endpoints for login, registration, OTP and authentication. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/auth/auth.service.js`**
  Contains the main business rules for login, registration, OTP and authentication. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/auth/auth.validation.js`**
  Defines Zod request schemas for login, registration, OTP and authentication. It rejects missing or invalid API input before business logic runs.

- **`server/src/modules/auth/email.service.js`**
  Builds authentication-related emails such as verification or password-reset messages and sends them through the email integration.

### `chatbot`

- **`server/src/modules/chatbot/chatbot.controller.js`**
  Receives HTTP requests for Rakshak chatbot access and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/chatbot/chatbot.provider.js`**
  Handles the provider-facing part of chatbot communication so chatbot business logic is separated from the external AI service details.

- **`server/src/modules/chatbot/chatbot.routes.js`**
  Defines the HTTP endpoints for Rakshak chatbot access. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/chatbot/chatbot.service.js`**
  Contains the main business rules for Rakshak chatbot access. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/chatbot/chatbot.validation.js`**
  Defines Zod request schemas for Rakshak chatbot access. It rejects missing or invalid API input before business logic runs.

### `check-in`

- **`server/src/modules/check-in/check-in.controller.js`**
  Receives HTTP requests for tourist safety check-ins and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/check-in/check-in.repository.js`**
  Contains Prisma/database queries for tourist safety check-ins. Other layers use it instead of writing database queries directly.

- **`server/src/modules/check-in/check-in.routes.js`**
  Defines the HTTP endpoints for tourist safety check-ins. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/check-in/check-in.service.js`**
  Contains the main business rules for tourist safety check-ins. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/check-in/check-in.validation.js`**
  Defines Zod request schemas for tourist safety check-ins. It rejects missing or invalid API input before business logic runs.

### `communication`

- **`server/src/modules/communication/communication.controller.js`**
  Receives HTTP requests for incident communication between authorities and responders and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/communication/communication.repository.js`**
  Contains Prisma/database queries for incident communication between authorities and responders. Other layers use it instead of writing database queries directly.

- **`server/src/modules/communication/communication.service.js`**
  Contains the main business rules for incident communication between authorities and responders. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/communication/communication.validation.js`**
  Defines Zod request schemas for incident communication between authorities and responders. It rejects missing or invalid API input before business logic runs.

### `consent`

- **`server/src/modules/consent/consent.controller.js`**
  Receives HTTP requests for tourist consent records and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/consent/consent.repository.js`**
  Contains Prisma/database queries for tourist consent records. Other layers use it instead of writing database queries directly.

- **`server/src/modules/consent/consent.routes.js`**
  Defines the HTTP endpoints for tourist consent records. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/consent/consent.service.js`**
  Contains the main business rules for tourist consent records. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/consent/consent.validation.js`**
  Defines Zod request schemas for tourist consent records. It rejects missing or invalid API input before business logic runs.

### `credential`

- **`server/src/modules/credential/credential.controller.js`**
  Receives HTTP requests for digital/blockchain-backed credentials and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/credential/credential.repository.js`**
  Contains Prisma/database queries for digital/blockchain-backed credentials. Other layers use it instead of writing database queries directly.

- **`server/src/modules/credential/credential.routes.js`**
  Defines the HTTP endpoints for digital/blockchain-backed credentials. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/credential/credential.service.js`**
  Contains the main business rules for digital/blockchain-backed credentials. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/credential/credential.validation.js`**
  Defines Zod request schemas for digital/blockchain-backed credentials. It rejects missing or invalid API input before business logic runs.

### `dashboard`

- **`server/src/modules/dashboard/dashboard.controller.js`**
  Receives HTTP requests for role-specific dashboard data and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/dashboard/dashboard.repository.js`**
  Contains Prisma/database queries for role-specific dashboard data. Other layers use it instead of writing database queries directly.

- **`server/src/modules/dashboard/dashboard.routes.js`**
  Defines the HTTP endpoints for role-specific dashboard data. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/dashboard/dashboard.service.js`**
  Contains the main business rules for role-specific dashboard data. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/dashboard/dashboard.validation.js`**
  Defines Zod request schemas for role-specific dashboard data. It rejects missing or invalid API input before business logic runs.

### `destination`

- **`server/src/modules/destination/destination.controller.js`**
  Receives HTTP requests for supported tourist destinations and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/destination/destination.repository.js`**
  Contains Prisma/database queries for supported tourist destinations. Other layers use it instead of writing database queries directly.

- **`server/src/modules/destination/destination.routes.js`**
  Defines the HTTP endpoints for supported tourist destinations. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/destination/destination.service.js`**
  Contains the main business rules for supported tourist destinations. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/destination/destination.validation.js`**
  Defines Zod request schemas for supported tourist destinations. It rejects missing or invalid API input before business logic runs.

### `disaster-management`

- **`server/src/modules/disaster-management/disaster-management.controller.js`**
  Receives HTTP requests for Disaster Management incident queue and authority workflows and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/disaster-management/disaster-management.repository.js`**
  Contains Prisma/database queries for Disaster Management incident queue and authority workflows. Other layers use it instead of writing database queries directly.

- **`server/src/modules/disaster-management/disaster-management.routes.js`**
  Defines the HTTP endpoints for Disaster Management incident queue and authority workflows. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/disaster-management/disaster-management.service.js`**
  Contains the main business rules for Disaster Management incident queue and authority workflows. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/disaster-management/disaster-management.validation.js`**
  Defines Zod request schemas for Disaster Management incident queue and authority workflows. It rejects missing or invalid API input before business logic runs.

- **`server/src/modules/disaster-management/jurisdiction-places.service.js`**
  Finds nearby emergency-service places for Disaster Management jurisdiction/location views using the Google Places integration.

### `dispatch`

- **`server/src/modules/dispatch/dispatch.controller.js`**
  Receives HTTP requests for incident-to-responder dispatch workflow and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/dispatch/dispatch.repository.js`**
  Contains Prisma/database queries for incident-to-responder dispatch workflow. Other layers use it instead of writing database queries directly.

- **`server/src/modules/dispatch/dispatch.routes.js`**
  Defines the HTTP endpoints for incident-to-responder dispatch workflow. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/dispatch/dispatch.service.js`**
  Contains the main business rules for incident-to-responder dispatch workflow. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/dispatch/dispatch.validation.js`**
  Defines Zod request schemas for incident-to-responder dispatch workflow. It rejects missing or invalid API input before business logic runs.

### `emergency-service`

- **`server/src/modules/emergency-service/emergency-service.controller.js`**
  Receives HTTP requests for police, ambulance and fire service accounts/units and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/emergency-service/emergency-service.repository.js`**
  Contains Prisma/database queries for police, ambulance and fire service accounts/units. Other layers use it instead of writing database queries directly.

- **`server/src/modules/emergency-service/emergency-service.routes.js`**
  Defines the HTTP endpoints for police, ambulance and fire service accounts/units. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/emergency-service/emergency-service.service.js`**
  Contains the main business rules for police, ambulance and fire service accounts/units. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/emergency-service/emergency-service.validation.js`**
  Defines Zod request schemas for police, ambulance and fire service accounts/units. It rejects missing or invalid API input before business logic runs.

### `escalation`

- **`server/src/modules/escalation/escalation.controller.js`**
  Receives HTTP requests for incident escalation rules and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/escalation/escalation.repository.js`**
  Contains Prisma/database queries for incident escalation rules. Other layers use it instead of writing database queries directly.

- **`server/src/modules/escalation/escalation.routes.js`**
  Defines the HTTP endpoints for incident escalation rules. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/escalation/escalation.service.js`**
  Contains the main business rules for incident escalation rules. It decides what should happen and coordinates repositories, notifications or other services.

### `evidence`

- **`server/src/modules/evidence/evidence.controller.js`**
  Receives HTTP requests for incident evidence and attachments and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/evidence/evidence.repository.js`**
  Contains Prisma/database queries for incident evidence and attachments. Other layers use it instead of writing database queries directly.

- **`server/src/modules/evidence/evidence.routes.js`**
  Defines the HTTP endpoints for incident evidence and attachments. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/evidence/evidence.service.js`**
  Contains the main business rules for incident evidence and attachments. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/evidence/evidence.upload.js`**
  Configures evidence-specific upload handling before uploaded files are stored and linked to evidence records.

- **`server/src/modules/evidence/evidence.validation.js`**
  Defines Zod request schemas for incident evidence and attachments. It rejects missing or invalid API input before business logic runs.

### `geofence`

- **`server/src/modules/geofence/geofence.controller.js`**
  Receives HTTP requests for geofence checks and zone evaluation and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/geofence/geofence.repository.js`**
  Contains Prisma/database queries for geofence checks and zone evaluation. Other layers use it instead of writing database queries directly.

- **`server/src/modules/geofence/geofence.routes.js`**
  Defines the HTTP endpoints for geofence checks and zone evaluation. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/geofence/geofence.service.js`**
  Contains the main business rules for geofence checks and zone evaluation. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/geofence/geofence.validation.js`**
  Defines Zod request schemas for geofence checks and zone evaluation. It rejects missing or invalid API input before business logic runs.

### `group`

- **`server/src/modules/group/group.controller.js`**
  Receives HTTP requests for tourist group membership, joining, approval and locking and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/group/group.repository.js`**
  Contains Prisma/database queries for tourist group membership, joining, approval and locking. Other layers use it instead of writing database queries directly.

- **`server/src/modules/group/group.routes.js`**
  Defines the HTTP endpoints for tourist group membership, joining, approval and locking. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/group/group.service.js`**
  Contains business rules for group creation, joining, approval, locking and membership changes. It enforces who may change the group and when planning/start rules allow progress.

- **`server/src/modules/group/group.validation.js`**
  Defines Zod request schemas for tourist group membership, joining, approval and locking. It rejects missing or invalid API input before business logic runs.

### `hazard`

- **`server/src/modules/hazard/hazard.controller.js`**
  Receives HTTP requests for manual tourist hazard/incident reports and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/hazard/hazard.repository.js`**
  Contains Prisma/database queries for manual tourist hazard/incident reports. Other layers use it instead of writing database queries directly.

- **`server/src/modules/hazard/hazard.routes.js`**
  Defines the HTTP endpoints for manual tourist hazard/incident reports. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/hazard/hazard.service.js`**
  Contains the main business rules for manual tourist hazard/incident reports. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/hazard/hazard.validation.js`**
  Defines Zod request schemas for manual tourist hazard/incident reports. It rejects missing or invalid API input before business logic runs.

### `health`

- **`server/src/modules/health/health.controller.js`**
  Receives HTTP requests for service health checks and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/health/health.repository.js`**
  Contains Prisma/database queries for service health checks. Other layers use it instead of writing database queries directly.

- **`server/src/modules/health/health.routes.js`**
  Defines the HTTP endpoints for service health checks. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/health/health.service.js`**
  Contains the main business rules for service health checks. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/health/health.validation.js`**
  Defines Zod request schemas for service health checks. It rejects missing or invalid API input before business logic runs.

### `incident`

- **`server/src/modules/incident/incident.controller.js`**
  Receives HTTP requests for incident lifecycle and assignment and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/incident/incident.repository.js`**
  Contains Prisma/database queries for incident lifecycle and assignment. Other layers use it instead of writing database queries directly.

- **`server/src/modules/incident/incident.routes.js`**
  Defines the HTTP endpoints for incident lifecycle and assignment. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/incident/incident.service.js`**
  Contains the main business rules for incident lifecycle and assignment. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/incident/incident.validation.js`**
  Defines Zod request schemas for incident lifecycle and assignment. It rejects missing or invalid API input before business logic runs.

### `integrations`

- **`server/src/modules/integrations/ai.provider.js`**
  Provider wrapper used by the integrations module to expose AI integration health/status or calls safely.

- **`server/src/modules/integrations/blockchain.provider.js`**
  Provider wrapper used by the integrations module to expose blockchain integration health/status or calls safely.

- **`server/src/modules/integrations/integration.controller.js`**
  Receives HTTP requests for external integration boundary and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/integrations/integration.routes.js`**
  Defines the HTTP endpoints for external integration boundary. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/integrations/integration.service.js`**
  Contains the main business rules for external integration boundary. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/integrations/integration.validation.js`**
  Defines Zod request schemas for external integration boundary. It rejects missing or invalid API input before business logic runs.

### `monitoring`

- **`server/src/modules/monitoring/monitoring.controller.js`**
  Receives HTTP requests for automatic trip safety monitoring and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/monitoring/monitoring.repository.js`**
  Contains Prisma/database queries for automatic trip safety monitoring. Other layers use it instead of writing database queries directly.

- **`server/src/modules/monitoring/monitoring.routes.js`**
  Defines the HTTP endpoints for automatic trip safety monitoring. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/monitoring/monitoring.service.js`**
  Contains the main business rules for automatic trip safety monitoring. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/monitoring/monitoring.validation.js`**
  Defines Zod request schemas for automatic trip safety monitoring. It rejects missing or invalid API input before business logic runs.

### `notification`

- **`server/src/modules/notification/notification.controller.js`**
  Receives HTTP requests for in-app and emergency notification records and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/notification/notification.repository.js`**
  Contains Prisma/database queries for in-app and emergency notification records. Other layers use it instead of writing database queries directly.

- **`server/src/modules/notification/notification.routes.js`**
  Defines the HTTP endpoints for in-app and emergency notification records. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/notification/notification.service.js`**
  Contains the main business rules for in-app and emergency notification records. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/notification/notification.validation.js`**
  Defines Zod request schemas for in-app and emergency notification records. It rejects missing or invalid API input before business logic runs.

### `notification-delivery`

- **`server/src/modules/notification-delivery/notification-delivery.controller.js`**
  Receives HTTP requests for delivery of notifications through external channels and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/notification-delivery/notification-delivery.provider.js`**
  Chooses/calls the correct delivery provider for a notification, keeping provider details out of the service layer.

- **`server/src/modules/notification-delivery/notification-delivery.repository.js`**
  Contains Prisma/database queries for delivery of notifications through external channels. Other layers use it instead of writing database queries directly.

- **`server/src/modules/notification-delivery/notification-delivery.routes.js`**
  Defines the HTTP endpoints for delivery of notifications through external channels. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/notification-delivery/notification-delivery.service.js`**
  Contains the main business rules for delivery of notifications through external channels. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/notification-delivery/notification-delivery.validation.js`**
  Defines Zod request schemas for delivery of notifications through external channels. It rejects missing or invalid API input before business logic runs.

### `observability`

- **`server/src/modules/observability/observability.controller.js`**
  Receives HTTP requests for operational metrics and health information and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/observability/observability.routes.js`**
  Defines the HTTP endpoints for operational metrics and health information. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/observability/observability.service.js`**
  Contains the main business rules for operational metrics and health information. It decides what should happen and coordinates repositories, notifications or other services.

### `responder-unit`

- **`server/src/modules/responder-unit/responder-unit.controller.js`**
  Receives HTTP requests for responder/fleet unit management and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/responder-unit/responder-unit.repository.js`**
  Contains Prisma/database queries for responder/fleet unit management. Other layers use it instead of writing database queries directly.

- **`server/src/modules/responder-unit/responder-unit.routes.js`**
  Defines the HTTP endpoints for responder/fleet unit management. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/responder-unit/responder-unit.service.js`**
  Contains the main business rules for responder/fleet unit management. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/responder-unit/responder-unit.validation.js`**
  Defines Zod request schemas for responder/fleet unit management. It rejects missing or invalid API input before business logic runs.

### `risk-zone`

- **`server/src/modules/risk-zone/risk-zone.controller.js`**
  Receives HTTP requests for danger/risk zones and geospatial safety rules and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/risk-zone/risk-zone.repository.js`**
  Contains Prisma/database queries for danger/risk zones and geospatial safety rules. Other layers use it instead of writing database queries directly.

- **`server/src/modules/risk-zone/risk-zone.routes.js`**
  Defines the HTTP endpoints for danger/risk zones and geospatial safety rules. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/risk-zone/risk-zone.service.js`**
  Contains the main business rules for danger/risk zones and geospatial safety rules. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/risk-zone/risk-zone.validation.js`**
  Defines Zod request schemas for danger/risk zones and geospatial safety rules. It rejects missing or invalid API input before business logic runs.

### `safety`

- **`server/src/modules/safety/safety.controller.js`**
  Receives HTTP requests for trip safety rules and detected safety conditions and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/safety/safety.repository.js`**
  Contains Prisma/database queries for trip safety rules and detected safety conditions. Other layers use it instead of writing database queries directly.

- **`server/src/modules/safety/safety.routes.js`**
  Defines the HTTP endpoints for trip safety rules and detected safety conditions. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/safety/safety.service.js`**
  Contains the main business rules for trip safety rules and detected safety conditions. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/safety/safety.validation.js`**
  Defines Zod request schemas for trip safety rules and detected safety conditions. It rejects missing or invalid API input before business logic runs.

### `safety-id`

- **`server/src/modules/safety-id/safety-id.controller.js`**
  Receives HTTP requests for tourist safety ID records and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/safety-id/safety-id.repository.js`**
  Contains Prisma/database queries for tourist safety ID records. Other layers use it instead of writing database queries directly.

- **`server/src/modules/safety-id/safety-id.routes.js`**
  Defines the HTTP endpoints for tourist safety ID records. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/safety-id/safety-id.service.js`**
  Contains the main business rules for tourist safety ID records. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/safety-id/safety-id.validation.js`**
  Defines Zod request schemas for tourist safety ID records. It rejects missing or invalid API input before business logic runs.

### `signal-loss`

- **`server/src/modules/signal-loss/signal-loss.controller.js`**
  Receives HTTP requests for solo/group signal-loss and group-separation safety cases and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/signal-loss/signal-loss.repository.js`**
  Contains Prisma/database queries for solo/group signal-loss and group-separation safety cases. Other layers use it instead of writing database queries directly.

- **`server/src/modules/signal-loss/signal-loss.routes.js`**
  Defines the HTTP endpoints for solo/group signal-loss and group-separation safety cases. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/signal-loss/signal-loss.service.js`**
  Contains the business rules for solo signal loss, group signal loss and dynamic 500 m group-centroid separation safety checks. It handles confirmation, auto-clear and escalation into incidents.

- **`server/src/modules/signal-loss/signal-loss.validation.js`**
  Defines Zod request schemas for solo/group signal-loss and group-separation safety cases. It rejects missing or invalid API input before business logic runs.

### `sos`

- **`server/src/modules/sos/sos.controller.js`**
  Receives HTTP requests for tourist SOS emergencies and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/sos/sos.repository.js`**
  Contains Prisma/database queries for tourist SOS emergencies. Other layers use it instead of writing database queries directly.

- **`server/src/modules/sos/sos.routes.js`**
  Defines the HTTP endpoints for tourist SOS emergencies. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/sos/sos.service.js`**
  Contains the main business rules for tourist SOS emergencies. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/sos/sos.validation.js`**
  Defines Zod request schemas for tourist SOS emergencies. It rejects missing or invalid API input before business logic runs.

### `system-admin`

- **`server/src/modules/system-admin/system-admin.controller.js`**
  Receives HTTP requests for system administrator operations and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/system-admin/system-admin.repository.js`**
  Contains Prisma/database queries for system administrator operations. Other layers use it instead of writing database queries directly.

- **`server/src/modules/system-admin/system-admin.routes.js`**
  Defines the HTTP endpoints for system administrator operations. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/system-admin/system-admin.service.js`**
  Contains the main business rules for system administrator operations. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/system-admin/system-admin.validation.js`**
  Defines Zod request schemas for system administrator operations. It rejects missing or invalid API input before business logic runs.

### `tourist`

- **`server/src/modules/tourist/tourist.controller.js`**
  Receives HTTP requests for tourist profiles and onboarding and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/tourist/tourist.repository.js`**
  Contains Prisma/database queries for tourist profiles and onboarding. Other layers use it instead of writing database queries directly.

- **`server/src/modules/tourist/tourist.routes.js`**
  Defines the HTTP endpoints for tourist profiles and onboarding. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/tourist/tourist.service.js`**
  Contains the main business rules for tourist profiles and onboarding. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/tourist/tourist.validation.js`**
  Defines Zod request schemas for tourist profiles and onboarding. It rejects missing or invalid API input before business logic runs.

### `tracking`

- **`server/src/modules/tracking/tracking.controller.js`**
  Receives HTTP requests for trusted tourist GPS tracking and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/tracking/tracking.repository.js`**
  Contains Prisma/database queries for trusted tourist GPS tracking. Other layers use it instead of writing database queries directly.

- **`server/src/modules/tracking/tracking.routes.js`**
  Defines the HTTP endpoints for trusted tourist GPS tracking. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/tracking/tracking.service.js`**
  Contains the main business rules for trusted tourist GPS tracking. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/tracking/tracking.validation.js`**
  Defines Zod request schemas for trusted tourist GPS tracking. It rejects missing or invalid API input before business logic runs.

### `trip`

- **`server/src/modules/trip/trip.controller.js`**
  Receives HTTP requests for trip creation, planning, lifecycle and history and passes them to the service layer. It converts the result into the API response.

- **`server/src/modules/trip/trip.repository.js`**
  Contains Prisma/database queries for trip creation, planning, lifecycle and history. Other layers use it instead of writing database queries directly.

- **`server/src/modules/trip/trip.routes.js`**
  Defines the HTTP endpoints for trip creation, planning, lifecycle and history. It connects URLs to authentication/validation middleware and controller functions.

- **`server/src/modules/trip/trip.service.js`**
  Contains the main business rules for trip creation, planning, lifecycle and history. It decides what should happen and coordinates repositories, notifications or other services.

- **`server/src/modules/trip/trip.validation.js`**
  Defines Zod request schemas for trip creation, planning, lifecycle and history. It rejects missing or invalid API input before business logic runs.

## Observability

- **`server/src/observability/metrics.js`**
  Defines and stores backend operational metrics such as request counts/timings. Monitoring endpoints/services read these values for observability.

## Realtime / Socket.IO

- **`server/src/realtime/group.gateway.js`**
  Handles Socket.IO rooms/events related to group membership and group updates.

- **`server/src/realtime/incident.gateway.js`**
  Handles real-time incident events for authorized authority/responder clients.

- **`server/src/realtime/locationPublisher.js`**
  Publishes trusted location updates to the correct real-time subscribers.

- **`server/src/realtime/realtimePublisher.js`**
  Shared helper used by services to publish application events without depending directly on Socket.IO internals.

- **`server/src/realtime/socketAuth.middleware.js`**
  Authenticates Socket.IO connections before they may join protected rooms or receive private events.

- **`server/src/realtime/socketServer.js`**
  Creates/configures the Socket.IO server and wires its authentication and gateways.

- **`server/src/realtime/tracking.gateway.js`**
  Handles real-time tracking subscriptions and tracking-related socket events.

## Route and server entry points

- **`server/src/app.js`**
  Builds the Express application: middleware, security, routes and error handling are wired here. Tests can use the app without starting a network server.

- **`server/src/routes/index.js`**
  Central API router that mounts all feature/module routes under the backend API. It is the main bridge from Express to the individual modules.

- **`server/src/server.js`**
  Runtime entry point that starts the HTTP server, Socket.IO and background jobs after configuration/database setup. This is what actually listens for incoming traffic.

## Automated tests

### `tests/dashboard-fix/`

- **`server/tests/dashboard-fix/dashboard-safety-sync.service.test.js`**
  Regression test for Dashboard Safety Sync. It protects a previously fixed dashboard/query behavior from breaking again.

- **`server/tests/dashboard-fix/validate-query.middleware.test.js`**
  Regression test for Validate Query. It protects a previously fixed dashboard/query behavior from breaking again.

### `tests/e2e/`

- **`server/tests/e2e/lostMemberResponse.e2e.test.js`**
  End-to-end test for Lost Member Response E2e. It checks the complete flow across routes, services and database behavior rather than one isolated function.

- **`server/tests/e2e/roleAccessControl.e2e.test.js`**
  End-to-end test for Role Access Control E2e. It checks the complete flow across routes, services and database behavior rather than one isolated function.

- **`server/tests/e2e/touristSosDispatch.e2e.test.js`**
  End-to-end test for Tourist SOS Dispatch E2e. It checks the complete flow across routes, services and database behavior rather than one isolated function.

- **`server/tests/e2e/tripCompletion.e2e.test.js`**
  End-to-end test for Trip Completion E2e. It checks the complete flow across routes, services and database behavior rather than one isolated function.

### `tests/fixtures/`

- **`server/tests/fixtures/groups.fixture.js`**
  Provides reusable fake Groups data for tests. It keeps test setup short and consistent.

- **`server/tests/fixtures/incidents.fixture.js`**
  Provides reusable fake Incidents data for tests. It keeps test setup short and consistent.

- **`server/tests/fixtures/locations.fixture.js`**
  Provides reusable fake Locations data for tests. It keeps test setup short and consistent.

- **`server/tests/fixtures/trips.fixture.js`**
  Provides reusable fake Trips data for tests. It keeps test setup short and consistent.

- **`server/tests/fixtures/users.fixture.js`**
  Provides reusable fake Users data for tests. It keeps test setup short and consistent.

### `tests/helpers/`

- **`server/tests/helpers/authTokens.js`**
  Reusable test helper for Auth Tokens. Multiple test files use it to avoid repeating setup or request/database code.

- **`server/tests/helpers/createTestApp.js`**
  Reusable test helper for Create Test App. Multiple test files use it to avoid repeating setup or request/database code.

- **`server/tests/helpers/request.js`**
  Reusable test helper for Request. Multiple test files use it to avoid repeating setup or request/database code.

- **`server/tests/helpers/testDatabase.js`**
  Reusable test helper for Test Database. Multiple test files use it to avoid repeating setup or request/database code.

### `tests/integration/`

- **`server/tests/integration/admin.api.test.js`**
  Integration/API test for Admin. It checks that multiple backend layers work together through the exposed API behavior.

- **`server/tests/integration/auth.api.test.js`**
  Integration/API test for Auth. It checks that multiple backend layers work together through the exposed API behavior.

- **`server/tests/integration/dispatch.api.test.js`**
  Integration/API test for Dispatch. It checks that multiple backend layers work together through the exposed API behavior.

- **`server/tests/integration/group.api.test.js`**
  Integration/API test for Group. It checks that multiple backend layers work together through the exposed API behavior.

- **`server/tests/integration/incident.api.test.js`**
  Integration/API test for Incident. It checks that multiple backend layers work together through the exposed API behavior.

- **`server/tests/integration/sos.api.test.js`**
  Integration/API test for SOS. It checks that multiple backend layers work together through the exposed API behavior.

- **`server/tests/integration/tourist.api.test.js`**
  Integration/API test for Tourist. It checks that multiple backend layers work together through the exposed API behavior.

- **`server/tests/integration/tracking.api.test.js`**
  Integration/API test for Tracking. It checks that multiple backend layers work together through the exposed API behavior.

- **`server/tests/integration/trip.api.test.js`**
  Integration/API test for Trip. It checks that multiple backend layers work together through the exposed API behavior.

### `tests/load/`

- **`server/tests/load/sos.k6.js`**
  k6 load-test script for SOS. It measures how the backend behaves when many requests are sent repeatedly.

- **`server/tests/load/tracking.k6.js`**
  k6 load-test script for Tracking. It measures how the backend behaves when many requests are sent repeatedly.

### `tests/mocks/`

- **`server/tests/mocks/disasterFeed.mock.js`**
  Fake Disaster Feed Mock implementation used in tests so automated tests do not call the real external service.

- **`server/tests/mocks/googleMaps.mock.js`**
  Fake Google Maps Mock implementation used in tests so automated tests do not call the real external service.

- **`server/tests/mocks/notification.mock.js`**
  Fake Notification Mock implementation used in tests so automated tests do not call the real external service.

- **`server/tests/mocks/objectStorage.mock.js`**
  Fake Object Storage Mock implementation used in tests so automated tests do not call the real external service.

### `tests/phase0/`

- **`server/tests/phase0/app.test.js`**
  Test for App from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase0/database.test.js`**
  Test for Database from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase0/environment.test.js`**
  Test for Environment from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase0/error-normalization.test.js`**
  Test for Error Normalization from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase0/health.service.test.js`**
  Test for Health from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase0/server.test.js`**
  Test for Server from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase0/socket-server.test.js`**
  Test for Socket Server from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase1/`

- **`server/tests/phase1/auth.validation.test.js`**
  Test for Auth from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase1/tourist.service.test.js`**
  Test for Tourist from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase10/`

- **`server/tests/phase10/incident.socket.test.js`**
  Test for Incident from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase10/realtime.publisher.test.js`**
  Test for Realtime Publisher from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase10/socket.auth.test.js`**
  Test for Socket Auth from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase11/`

- **`server/tests/phase11/disaster-management.service.test.js`**
  Test for Disaster Management from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase11/disaster-management.validation.test.js`**
  Test for Disaster Management from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase11/incident.assignment-capacity.test.js`**
  Test for Incident Assignment Capacity from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase12/`

- **`server/tests/phase12/hazard.service.test.js`**
  Test for Hazard from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase12/hazard.validation.test.js`**
  Test for Hazard from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase12/hazard.visibility.test.js`**
  Test for Hazard Visibility from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase13/`

- **`server/tests/phase13/geofence.util.test.js`**
  Test for Geofence from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase13/risk-zone.service.test.js`**
  Test for Risk Zone from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase13/risk-zone.validation.test.js`**
  Test for Risk Zone from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase13/safety.geofence.integration.test.js`**
  Test for Safety Geofence from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase14/`

- **`server/tests/phase14/group-route.monitoring.test.js`**
  Test for Group Route Monitoring from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase14/monitoring.service.test.js`**
  Test for Monitoring from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase14/monitoring.validation.test.js`**
  Test for Monitoring from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase14/route-distance.test.js`**
  Test for Route Distance from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase15/`

- **`server/tests/phase15/dispatch.service.test.js`**
  Test for Dispatch from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase15/dispatch.validation.test.js`**
  Test for Dispatch from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase16/`

- **`server/tests/phase16/communication.service.test.js`**
  Test for Communication from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase16/communication.validation.test.js`**
  Test for Communication from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase16/realtime.publisher.test.js`**
  Test for Realtime Publisher from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase17/`

- **`server/tests/phase17/evidence.service.test.js`**
  Test for Evidence from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase17/evidence.validation.test.js`**
  Test for Evidence from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase17/storage.adapter.test.js`**
  Test for Storage from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase18/`

- **`server/tests/phase18/system-admin.service.test.js`**
  Test for System Admin from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase18/system-admin.validation.test.js`**
  Test for System Admin from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase19/`

- **`server/tests/phase19/analytics.authorization.test.js`**
  Test for Analytics Authorization from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase19/analytics.service.test.js`**
  Test for Analytics from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase19/analytics.validation.test.js`**
  Test for Analytics from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase20-21/`

- **`server/tests/phase20-21/integration.service.test.js`**
  Test for Integration from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase20-21/integration.validation.test.js`**
  Test for Integration from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase20-21/provider.boundary.test.js`**
  Test for Provider Boundary from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase22/`

- **`server/tests/phase22/notification-delivery.provider.test.js`**
  Test for Notification Delivery from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase22/notification-delivery.service.test.js`**
  Test for Notification Delivery from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase22/notification-delivery.validation.test.js`**
  Test for Notification Delivery from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase23/`

- **`server/tests/phase23/authentication.security.test.js`**
  Test for Authentication from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase23/jwt.security.test.js`**
  Test for JWT from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase23/privacy-headers.test.js`**
  Test for Privacy Headers from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase23/request-security.middleware.test.js`**
  Test for Request Security from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase23/storage.security.test.js`**
  Test for Storage from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase24/`

- **`server/tests/phase24/audit.middleware.test.js`**
  Test for Audit from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase24/audit.service.test.js`**
  Test for Audit from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase24/audit.validation.test.js`**
  Test for Audit from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase24/metrics.test.js`**
  Test for Metrics from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase24/observability.middleware.test.js`**
  Test for Observability from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase24/observability.service.test.js`**
  Test for Observability from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase24/signal-loss.auto-escalation.test.js`**
  Test for Signal Loss Auto Escalation from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase24/solo-signal-loss.test.js`**
  Test for Solo Signal Loss from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase25/`

- **`server/tests/phase25/email-verification.service.test.js`**
  Test for Email Verification from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase25/email-verification.socket.test.js`**
  Test for Email Verification from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase25/email-verification.validation.test.js`**
  Test for Email Verification from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase25/email.service.test.js`**
  Test for Email from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase26/`

- **`server/tests/phase26/chatbot.service.test.js`**
  Test for Chatbot from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase26/chatbot.validation.test.js`**
  Test for Chatbot from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase27/`

- **`server/tests/phase27/analytics-live-charts.service.test.js`**
  Test for Analytics Live Charts from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase27/cloudinary.adapter.test.js`**
  Test for Cloudinary from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase27/disaster-jurisdiction.repository.test.js`**
  Test for Disaster Jurisdiction from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase27/system-admin.destination.test.js`**
  Test for System Admin Destination from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase27/validate-query.middleware.test.js`**
  Test for Validate Query from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase28/`

- **`server/tests/phase28/redis-caching.test.js`**
  Test for Redis Caching from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase4/`

- **`server/tests/phase4/trip.extension-history.test.js`**
  Test for Trip Extension History from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase4/trip.service.test.js`**
  Test for Trip from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase4/trip.validation.test.js`**
  Test for Trip from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase5/`

- **`server/tests/phase5/group.service.test.js`**
  Test for Group from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase6/`

- **`server/tests/phase6/socket.tracking.test.js`**
  Test for Socket Tracking from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase6/tracking.service.test.js`**
  Test for Tracking from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase6/tracking.validation.test.js`**
  Test for Tracking from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase7/`

- **`server/tests/phase7/safety.service.test.js`**
  Test for Safety from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase7/safety.validation.test.js`**
  Test for Safety from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase7/tracking.safety.test.js`**
  Test for Tracking Safety from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase8/`

- **`server/tests/phase8/incident.service.test.js`**
  Test for Incident from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase8/safety.integration.test.js`**
  Test for Safety from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase8/validation.test.js`**
  Test for Validation from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/phase9/`

- **`server/tests/phase9/escalation.service.test.js`**
  Test for Escalation from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase9/incident.coordination.test.js`**
  Test for Incident Coordination from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase9/notification.service.test.js`**
  Test for Notification from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

- **`server/tests/phase9/validation.test.js`**
  Test for Validation from the corresponding backend feature area. It verifies the behavior and edge cases that feature depends on.

### `tests/security/`

- **`server/tests/security/authorization.security.test.js`**
  Security test for Authorization. It checks that private/protected operations cannot be accessed in an unsafe way.

- **`server/tests/security/evidenceAccess.security.test.js`**
  Security test for Evidence Access. It checks that private/protected operations cannot be accessed in an unsafe way.

- **`server/tests/security/locationPrivacy.security.test.js`**
  Security test for Location Privacy. It checks that private/protected operations cannot be accessed in an unsafe way.

### `tests/setup/`

- **`server/tests/setup/globalSetup.js`**
  Jest test-environment setup/cleanup for Global Setup. It prepares or resets shared resources around the test suite.

- **`server/tests/setup/globalTeardown.js`**
  Jest test-environment setup/cleanup for Global Teardown. It prepares or resets shared resources around the test suite.

- **`server/tests/setup/testEnvironment.js`**
  Jest test-environment setup/cleanup for Test Environment. It prepares or resets shared resources around the test suite.

### `tests/unit/`

- **`server/tests/unit/alertRules.service.test.js`**
  Unit test for Alert Rules. It tests a focused piece of backend logic with surrounding dependencies isolated where possible.

- **`server/tests/unit/auth.service.test.js`**
  Unit test for Auth. It tests a focused piece of backend logic with surrounding dependencies isolated where possible.

- **`server/tests/unit/dispatch.service.test.js`**
  Unit test for Dispatch. It tests a focused piece of backend logic with surrounding dependencies isolated where possible.

- **`server/tests/unit/geoDistance.test.js`**
  Unit test for Geo Distance. It tests a focused piece of backend logic with surrounding dependencies isolated where possible.

- **`server/tests/unit/groupSafety.service.test.js`**
  Unit test for Group Safety. It tests a focused piece of backend logic with surrounding dependencies isolated where possible.

- **`server/tests/unit/tripExpiry.test.js`**
  Unit test for Trip Expiry. It tests a focused piece of backend logic with surrounding dependencies isolated where possible.

---

**Files covered: 482**

When presenting the project, do not try to memorize every filename. Memorize the folder/layer pattern first, then use this file guide when a judge asks where a specific behavior is implemented.
