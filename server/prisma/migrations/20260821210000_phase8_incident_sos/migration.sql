-- Repair missing Phase 6 tracking DDL from the uploaded migration history.
-- These tables are already referenced by Phase 6/7 repositories. Guards make this
-- safe if they were created manually in an existing development database.
DO $$ BEGIN CREATE TYPE "NetworkStatus" AS ENUM ('WIFI','CELLULAR','OFFLINE','UNKNOWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LocationTrustStatus" AS ENUM ('TRUSTED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "trip_participant_consents" (
  "id" UUID NOT NULL, "tripId" UUID NOT NULL, "userId" UUID NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trip_participant_consents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "trip_participant_consents_tripId_userId_key" ON "trip_participant_consents"("tripId","userId");
CREATE INDEX IF NOT EXISTS "trip_participant_consents_userId_revokedAt_idx" ON "trip_participant_consents"("userId","revokedAt");

CREATE TABLE IF NOT EXISTS "location_pings" (
  "id" UUID NOT NULL, "tripId" UUID NOT NULL, "userId" UUID NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL, "longitude" DOUBLE PRECISION NOT NULL, "accuracyM" DOUBLE PRECISION NOT NULL,
  "altitudeM" DOUBLE PRECISION, "headingDeg" DOUBLE PRECISION, "speedMps" DOUBLE PRECISION, "batteryLevel" INTEGER,
  "networkStatus" "NetworkStatus", "capturedAt" TIMESTAMP(3) NOT NULL, "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trustStatus" "LocationTrustStatus" NOT NULL DEFAULT 'TRUSTED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "location_pings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "location_pings_tripId_userId_capturedAt_key" ON "location_pings"("tripId","userId","capturedAt");
CREATE INDEX IF NOT EXISTS "location_pings_tripId_userId_capturedAt_idx" ON "location_pings"("tripId","userId","capturedAt");

CREATE TABLE IF NOT EXISTS "latest_trusted_locations" (
  "id" UUID NOT NULL, "tripId" UUID NOT NULL, "userId" UUID NOT NULL, "locationPingId" UUID NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL, "longitude" DOUBLE PRECISION NOT NULL, "accuracyM" DOUBLE PRECISION NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "latest_trusted_locations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "latest_trusted_locations_tripId_userId_key" ON "latest_trusted_locations"("tripId","userId");
CREATE INDEX IF NOT EXISTS "latest_trusted_locations_locationPingId_idx" ON "latest_trusted_locations"("locationPingId");

DO $$ BEGIN ALTER TABLE "trip_participant_consents" ADD CONSTRAINT "trip_participant_consents_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "trip_participant_consents" ADD CONSTRAINT "trip_participant_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "location_pings" ADD CONSTRAINT "location_pings_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "location_pings" ADD CONSTRAINT "location_pings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "latest_trusted_locations" ADD CONSTRAINT "latest_trusted_locations_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "latest_trusted_locations" ADD CONSTRAINT "latest_trusted_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "latest_trusted_locations" ADD CONSTRAINT "latest_trusted_locations_locationPingId_fkey" FOREIGN KEY ("locationPingId") REFERENCES "location_pings"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TYPE "IncidentSourceType" AS ENUM ('SAFETY_ALERT','SOS');
CREATE TYPE "IncidentSeverity" AS ENUM ('WARNING','DANGER','CRITICAL');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','DISMISSED');
CREATE TYPE "IncidentEventType" AS ENUM ('CREATED','ACKNOWLEDGED','RESPONSE_STARTED','RESOLVED','DISMISSED');
CREATE TYPE "EmergencyType" AS ENUM ('MEDICAL','LOST','THREAT','ACCIDENT','NATURAL_DISASTER','OTHER');

CREATE TABLE "incidents" (
  "id" UUID NOT NULL, "tripId" UUID NOT NULL, "userId" UUID NOT NULL,
  "sourceType" "IncidentSourceType" NOT NULL, "sourceSafetyAlertId" UUID,
  "severity" "IncidentSeverity" NOT NULL, "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
  "title" VARCHAR(160) NOT NULL, "description" VARCHAR(1000), "latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION,
  "acknowledgedById" UUID, "acknowledgedByRole" "Role", "acknowledgedAt" TIMESTAMP(3), "startedAt" TIMESTAMP(3),
  "resolvedById" UUID, "resolvedByRole" "Role", "resolvedAt" TIMESTAMP(3), "dismissedAt" TIMESTAMP(3), "resolutionNote" VARCHAR(1000),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "incidents_sourceSafetyAlertId_key" ON "incidents"("sourceSafetyAlertId");
CREATE INDEX "incidents_status_severity_createdAt_idx" ON "incidents"("status","severity","createdAt");
CREATE INDEX "incidents_tripId_userId_status_idx" ON "incidents"("tripId","userId","status");

CREATE TABLE "incident_events" (
  "id" UUID NOT NULL, "incidentId" UUID NOT NULL, "type" "IncidentEventType" NOT NULL,
  "actorId" UUID, "actorRole" "Role", "note" VARCHAR(1000), "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "incident_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "incident_events_incidentId_createdAt_idx" ON "incident_events"("incidentId","createdAt");

CREATE TABLE "sos_requests" (
  "id" UUID NOT NULL, "incidentId" UUID NOT NULL, "tripId" UUID NOT NULL, "userId" UUID NOT NULL,
  "emergencyType" "EmergencyType" NOT NULL, "message" VARCHAR(500), "latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION, "accuracyM" DOUBLE PRECISION,
  "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sos_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sos_requests_incidentId_key" ON "sos_requests"("incidentId");
CREATE INDEX "sos_requests_tripId_userId_triggeredAt_idx" ON "sos_requests"("tripId","userId","triggeredAt");

ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_sourceSafetyAlertId_fkey" FOREIGN KEY ("sourceSafetyAlertId") REFERENCES "safety_alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incident_events" ADD CONSTRAINT "incident_events_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sos_requests" ADD CONSTRAINT "sos_requests_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sos_requests" ADD CONSTRAINT "sos_requests_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sos_requests" ADD CONSTRAINT "sos_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
