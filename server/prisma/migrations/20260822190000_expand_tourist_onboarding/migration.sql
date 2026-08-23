ALTER TABLE "users"
  ADD COLUMN "preferredLanguage" VARCHAR(40),
  ADD COLUMN "emergencyContactName" VARCHAR(120),
  ADD COLUMN "emergencyContactRelation" VARCHAR(60),
  ADD COLUMN "bloodGroup" VARCHAR(8),
  ADD COLUMN "governmentIdNumber" VARCHAR(120),
  ADD COLUMN "liveTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "geoAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;
