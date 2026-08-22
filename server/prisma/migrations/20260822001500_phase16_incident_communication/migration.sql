CREATE TABLE "incident_messages" (
  "id" UUID NOT NULL,
  "incidentId" UUID NOT NULL,
  "senderId" UUID NOT NULL,
  "senderRole" "Role" NOT NULL,
  "body" VARCHAR(2000) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "incident_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "incident_messages_incidentId_createdAt_idx"
  ON "incident_messages"("incidentId", "createdAt");
CREATE INDEX "incident_messages_senderId_senderRole_createdAt_idx"
  ON "incident_messages"("senderId", "senderRole", "createdAt");

ALTER TABLE "incident_messages"
  ADD CONSTRAINT "incident_messages_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "incidents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
