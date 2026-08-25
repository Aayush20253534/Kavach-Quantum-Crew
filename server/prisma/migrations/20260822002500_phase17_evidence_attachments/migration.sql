CREATE TYPE "AttachmentTargetType" AS ENUM ('INCIDENT', 'HAZARD');
CREATE TYPE "EvidenceKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

CREATE TABLE "attachments" (
  "id" UUID NOT NULL,
  "targetType" "AttachmentTargetType" NOT NULL,
  "incidentId" UUID,
  "hazardId" UUID,
  "uploaderId" UUID NOT NULL,
  "uploaderRole" "Role" NOT NULL,
  "kind" "EvidenceKind" NOT NULL,
  "originalName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(120) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "storageKey" VARCHAR(255) NOT NULL,
  "checksumSha256" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attachments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attachments_exactly_one_target_check" CHECK (
    ("targetType" = 'INCIDENT' AND "incidentId" IS NOT NULL AND "hazardId" IS NULL) OR
    ("targetType" = 'HAZARD' AND "hazardId" IS NOT NULL AND "incidentId" IS NULL)
  )
);

CREATE UNIQUE INDEX "attachments_storageKey_key" ON "attachments"("storageKey");
CREATE INDEX "attachments_incidentId_createdAt_idx" ON "attachments"("incidentId", "createdAt");
CREATE INDEX "attachments_hazardId_createdAt_idx" ON "attachments"("hazardId", "createdAt");
CREATE INDEX "attachments_uploaderId_uploaderRole_createdAt_idx" ON "attachments"("uploaderId", "uploaderRole", "createdAt");

ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_hazardId_fkey"
  FOREIGN KEY ("hazardId") REFERENCES "hazard_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
