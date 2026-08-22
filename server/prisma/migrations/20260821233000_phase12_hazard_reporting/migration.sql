CREATE TYPE "HazardType" AS ENUM ('FLOOD', 'LANDSLIDE', 'FIRE', 'ROAD_BLOCK', 'WEATHER', 'CROWD', 'UNSAFE_AREA', 'MEDICAL', 'OTHER');
CREATE TYPE "HazardSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "HazardStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED');

CREATE TABLE "hazard_reports" (
  "id" UUID NOT NULL,
  "reporterId" UUID NOT NULL,
  "reporterRole" "Role" NOT NULL,
  "type" "HazardType" NOT NULL,
  "severity" "HazardSeverity" NOT NULL DEFAULT 'MEDIUM',
  "status" "HazardStatus" NOT NULL DEFAULT 'PENDING',
  "title" VARCHAR(160) NOT NULL,
  "description" VARCHAR(1000) NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "locationName" VARCHAR(200),
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "reviewedById" UUID,
  "reviewedByRole" "Role",
  "moderationNote" VARCHAR(1000),
  "verifiedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hazard_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hazard_reports_status_severity_createdAt_idx" ON "hazard_reports"("status", "severity", "createdAt");
CREATE INDEX "hazard_reports_type_status_createdAt_idx" ON "hazard_reports"("type", "status", "createdAt");
CREATE INDEX "hazard_reports_reporterId_reporterRole_createdAt_idx" ON "hazard_reports"("reporterId", "reporterRole", "createdAt");
CREATE INDEX "hazard_reports_latitude_longitude_status_idx" ON "hazard_reports"("latitude", "longitude", "status");
