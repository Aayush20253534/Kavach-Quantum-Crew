ALTER TABLE "emergency_service_accounts"
  ALTER COLUMN "latitude" DROP NOT NULL,
  ALTER COLUMN "longitude" DROP NOT NULL,
  ALTER COLUMN "locationUpdatedAt" DROP NOT NULL,
  ALTER COLUMN "locationUpdatedAt" DROP DEFAULT;
