CREATE TYPE "ResponderStatus" AS ENUM ('AVAILABLE','BUSY','OFF_DUTY');

ALTER TABLE "disaster_managers"
  ADD COLUMN "department" VARCHAR(120),
  ADD COLUMN "responderStatus" "ResponderStatus" NOT NULL DEFAULT 'AVAILABLE',
  ADD COLUMN "maxActiveIncidents" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "statusChangedAt" TIMESTAMP(3);

CREATE INDEX "disaster_managers_responderStatus_status_idx"
  ON "disaster_managers"("responderStatus", "status");
CREATE INDEX "disaster_managers_organization_jurisdiction_idx"
  ON "disaster_managers"("organization", "jurisdiction");
