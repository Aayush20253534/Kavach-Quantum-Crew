CREATE TYPE "RiskZoneGeometry" AS ENUM ('CIRCLE', 'POLYGON');

ALTER TABLE "safety_zones"
  ADD COLUMN "geometryType" "RiskZoneGeometry" NOT NULL DEFAULT 'CIRCLE',
  ADD COLUMN "polygon" JSONB,
  ADD COLUMN "validFrom" TIMESTAMP(3),
  ADD COLUMN "validUntil" TIMESTAMP(3),
  ADD COLUMN "createdById" UUID,
  ADD COLUMN "createdByRole" "Role";

ALTER TABLE "safety_zones"
  ALTER COLUMN "latitude" DROP NOT NULL,
  ALTER COLUMN "longitude" DROP NOT NULL,
  ALTER COLUMN "radiusM" DROP NOT NULL;

CREATE INDEX "safety_zones_active_severity_geometryType_idx"
  ON "safety_zones"("active", "severity", "geometryType");
CREATE INDEX "safety_zones_validFrom_validUntil_idx"
  ON "safety_zones"("validFrom", "validUntil");

ALTER TABLE "geofence_events" ADD COLUMN "locationPingId" UUID;
CREATE INDEX "geofence_events_locationPingId_idx" ON "geofence_events"("locationPingId");
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_locationPingId_fkey" FOREIGN KEY ("locationPingId") REFERENCES "location_pings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
