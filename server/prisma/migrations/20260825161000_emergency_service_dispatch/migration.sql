ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'POLICE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FIRE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'AMBULANCE';

CREATE TABLE "emergency_service_accounts" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "username" VARCHAR(40) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "serviceType" "EmergencyUnitType" NOT NULL,
  "organization" VARCHAR(160),
  "address" VARCHAR(240),
  "jurisdiction" VARCHAR(160),
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "locationUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastLoginAt" TIMESTAMP(3),
  "passwordChangedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "emergency_service_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "emergency_service_accounts_username_key" ON "emergency_service_accounts"("username");
CREATE UNIQUE INDEX "emergency_service_accounts_email_key" ON "emergency_service_accounts"("email");
CREATE UNIQUE INDEX "emergency_service_accounts_phone_key" ON "emergency_service_accounts"("phone");
CREATE INDEX "emergency_service_accounts_serviceType_status_idx" ON "emergency_service_accounts"("serviceType", "status");
CREATE INDEX "emergency_service_accounts_latitude_longitude_idx" ON "emergency_service_accounts"("latitude", "longitude");

ALTER TABLE "emergency_units" ADD COLUMN "serviceAccountId" UUID;
ALTER TABLE "emergency_units" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "emergency_units" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "emergency_units" ADD COLUMN "locationUpdatedAt" TIMESTAMP(3);
CREATE INDEX "emergency_units_serviceAccountId_status_idx" ON "emergency_units"("serviceAccountId", "status");
CREATE INDEX "emergency_units_latitude_longitude_idx" ON "emergency_units"("latitude", "longitude");
ALTER TABLE "emergency_units" ADD CONSTRAINT "emergency_units_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "emergency_service_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
