CREATE TYPE "TripType" AS ENUM ('SOLO', 'GROUP');
CREATE TYPE "TripStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ConsentType" AS ENUM ('LOCATION_TRACKING', 'EMERGENCY_SHARING');
CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'REVOKED');

CREATE TABLE "trips" (
  "id" UUID NOT NULL,
  "touristId" UUID NOT NULL,
  "locationName" VARCHAR(160) NOT NULL,
  "tripType" "TripType" NOT NULL,
  "status" "TripStatus" NOT NULL DEFAULT 'PLANNED',
  "plannedStartAt" TIMESTAMP(3) NOT NULL,
  "plannedEndAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trip_safety_ids" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "publicId" VARCHAR(80) NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trip_safety_ids_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trip_consents" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "type" "ConsentType" NOT NULL,
  "status" "ConsentStatus" NOT NULL DEFAULT 'GRANTED',
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trip_consents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trips_touristId_status_createdAt_idx" ON "trips"("touristId", "status", "createdAt");
CREATE INDEX "trips_plannedStartAt_plannedEndAt_idx" ON "trips"("plannedStartAt", "plannedEndAt");
CREATE UNIQUE INDEX "trip_safety_ids_tripId_key" ON "trip_safety_ids"("tripId");
CREATE UNIQUE INDEX "trip_safety_ids_publicId_key" ON "trip_safety_ids"("publicId");
CREATE INDEX "trip_safety_ids_expiresAt_revokedAt_idx" ON "trip_safety_ids"("expiresAt", "revokedAt");
CREATE UNIQUE INDEX "trip_consents_tripId_type_key" ON "trip_consents"("tripId", "type");
CREATE INDEX "trip_consents_tripId_status_idx" ON "trip_consents"("tripId", "status");

ALTER TABLE "trips"
  ADD CONSTRAINT "trips_touristId_fkey"
  FOREIGN KEY ("touristId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trip_safety_ids"
  ADD CONSTRAINT "trip_safety_ids_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trip_consents"
  ADD CONSTRAINT "trip_consents_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
