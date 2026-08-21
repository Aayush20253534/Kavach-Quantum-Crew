CREATE TYPE "EmergencyUnitType" AS ENUM ('POLICE', 'AMBULANCE', 'FIRE', 'RESCUE', 'OTHER');
CREATE TYPE "EmergencyUnitStatus" AS ENUM ('AVAILABLE', 'DISPATCHED', 'OUT_OF_SERVICE');
CREATE TYPE "DispatchStatus" AS ENUM ('REQUESTED', 'ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "DispatchEventType" AS ENUM ('REQUESTED', 'ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "emergency_units" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "type" "EmergencyUnitType" NOT NULL,
  "status" "EmergencyUnitStatus" NOT NULL DEFAULT 'AVAILABLE',
  "organization" VARCHAR(160),
  "jurisdiction" VARCHAR(160),
  "contactPhone" VARCHAR(20),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "emergency_units_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "emergency_units_type_status_idx" ON "emergency_units"("type", "status");
CREATE INDEX "emergency_units_jurisdiction_status_idx" ON "emergency_units"("jurisdiction", "status");

CREATE TABLE "dispatches" (
  "id" UUID NOT NULL,
  "incidentId" UUID NOT NULL,
  "requestedUnitType" "EmergencyUnitType" NOT NULL,
  "unitId" UUID,
  "status" "DispatchStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestedById" UUID NOT NULL,
  "requestedByRole" "Role" NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedAt" TIMESTAMP(3),
  "dispatchedAt" TIMESTAMP(3),
  "enRouteAt" TIMESTAMP(3),
  "onSceneAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "dispatches_incidentId_createdAt_idx" ON "dispatches"("incidentId", "createdAt");
CREATE INDEX "dispatches_unitId_status_idx" ON "dispatches"("unitId", "status");
CREATE INDEX "dispatches_status_requestedAt_idx" ON "dispatches"("status", "requestedAt");
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "emergency_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "dispatch_events" (
  "id" UUID NOT NULL,
  "dispatchId" UUID NOT NULL,
  "type" "DispatchEventType" NOT NULL,
  "actorId" UUID,
  "actorRole" "Role",
  "note" VARCHAR(1000),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dispatch_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "dispatch_events_dispatchId_createdAt_idx" ON "dispatch_events"("dispatchId", "createdAt");
ALTER TABLE "dispatch_events" ADD CONSTRAINT "dispatch_events_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
