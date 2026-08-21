ALTER TYPE "SafetyAlertType" ADD VALUE IF NOT EXISTS 'TRACKING_INTERRUPTION';
ALTER TYPE "SafetyAlertType" ADD VALUE IF NOT EXISTS 'INACTIVITY';
ALTER TYPE "SafetyAlertType" ADD VALUE IF NOT EXISTS 'TRIP_OVERTIME';
ALTER TYPE "SafetyAlertType" ADD VALUE IF NOT EXISTS 'GROUP_SEPARATION';
ALTER TYPE "SafetyAlertType" ADD VALUE IF NOT EXISTS 'ROUTE_DEVIATION';

CREATE TABLE "trip_monitoring_policies" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "trackingGapAfterMinutes" INTEGER NOT NULL DEFAULT 5,
  "inactivityAfterMinutes" INTEGER NOT NULL DEFAULT 15,
  "inactivityRadiusM" DOUBLE PRECISION NOT NULL DEFAULT 50,
  "groupSeparationM" DOUBLE PRECISION NOT NULL DEFAULT 500,
  "routeDeviationM" DOUBLE PRECISION NOT NULL DEFAULT 300,
  "overtimeGraceMinutes" INTEGER NOT NULL DEFAULT 15,
  "plannedRoute" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trip_monitoring_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trip_monitoring_policies_tripId_key" ON "trip_monitoring_policies"("tripId");
CREATE INDEX "trip_monitoring_policies_enabled_updatedAt_idx" ON "trip_monitoring_policies"("enabled", "updatedAt");
ALTER TABLE "trip_monitoring_policies" ADD CONSTRAINT "trip_monitoring_policies_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
