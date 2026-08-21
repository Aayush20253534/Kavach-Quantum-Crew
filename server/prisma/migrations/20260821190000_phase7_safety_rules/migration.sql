CREATE TYPE "SafetyZoneType" AS ENUM ('SAFE', 'RISK');
CREATE TYPE "SafetySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "CheckInStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED');
CREATE TYPE "GeofenceEventType" AS ENUM ('ENTER', 'EXIT');
CREATE TYPE "SafetyAlertType" AS ENUM ('RISK_ZONE_ENTRY', 'MISSED_CHECK_IN', 'STALE_LOCATION');
CREATE TYPE "SafetyAlertLevel" AS ENUM ('WARNING', 'DANGER');
CREATE TYPE "SafetyAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE "safety_zones" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "type" "SafetyZoneType" NOT NULL,
  "severity" "SafetySeverity" NOT NULL DEFAULT 'LOW',
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "radiusM" DOUBLE PRECISION NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "safety_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trip_check_ins" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" "CheckInStatus" NOT NULL DEFAULT 'PENDING',
  "checkedInAt" TIMESTAMP(3),
  "missedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trip_check_ins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "geofence_events" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "zoneId" UUID NOT NULL,
  "locationPingId" UUID,
  "type" "GeofenceEventType" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "geofence_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "safety_alerts" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "SafetyAlertType" NOT NULL,
  "level" "SafetyAlertLevel" NOT NULL,
  "status" "SafetyAlertStatus" NOT NULL DEFAULT 'OPEN',
  "sourceId" VARCHAR(100),
  "message" VARCHAR(240) NOT NULL,
  "details" JSONB,
  "acknowledgedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "safety_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "safety_zones_active_type_idx" ON "safety_zones"("active", "type");
CREATE INDEX "trip_check_ins_tripId_userId_status_dueAt_idx" ON "trip_check_ins"("tripId", "userId", "status", "dueAt");
CREATE INDEX "trip_check_ins_status_dueAt_idx" ON "trip_check_ins"("status", "dueAt");
CREATE INDEX "geofence_events_tripId_userId_zoneId_occurredAt_idx" ON "geofence_events"("tripId", "userId", "zoneId", "occurredAt");
CREATE INDEX "geofence_events_zoneId_occurredAt_idx" ON "geofence_events"("zoneId", "occurredAt");
CREATE INDEX "safety_alerts_tripId_userId_status_createdAt_idx" ON "safety_alerts"("tripId", "userId", "status", "createdAt");
CREATE INDEX "safety_alerts_type_sourceId_status_idx" ON "safety_alerts"("type", "sourceId", "status");

ALTER TABLE "trip_check_ins" ADD CONSTRAINT "trip_check_ins_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_check_ins" ADD CONSTRAINT "trip_check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "safety_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_locationPingId_fkey" FOREIGN KEY ("locationPingId") REFERENCES "location_pings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_alerts" ADD CONSTRAINT "safety_alerts_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_alerts" ADD CONSTRAINT "safety_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
