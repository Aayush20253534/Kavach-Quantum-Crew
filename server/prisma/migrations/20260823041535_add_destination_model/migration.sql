-- DropForeignKey
ALTER TABLE "geofence_events" DROP CONSTRAINT "geofence_events_locationPingId_fkey";

-- DropForeignKey
ALTER TABLE "geofence_events" DROP CONSTRAINT "geofence_events_tripId_fkey";

-- DropForeignKey
ALTER TABLE "geofence_events" DROP CONSTRAINT "geofence_events_userId_fkey";

-- DropForeignKey
ALTER TABLE "geofence_events" DROP CONSTRAINT "geofence_events_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "incident_assignments" DROP CONSTRAINT "incident_assignments_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "incident_events" DROP CONSTRAINT "incident_events_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "incident_messages" DROP CONSTRAINT "incident_messages_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "incident_notes" DROP CONSTRAINT "incident_notes_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "incidents" DROP CONSTRAINT "incidents_sourceSafetyAlertId_fkey";

-- DropForeignKey
ALTER TABLE "incidents" DROP CONSTRAINT "incidents_tripId_fkey";

-- DropForeignKey
ALTER TABLE "incidents" DROP CONSTRAINT "incidents_userId_fkey";

-- DropForeignKey
ALTER TABLE "latest_trusted_locations" DROP CONSTRAINT "latest_trusted_locations_locationPingId_fkey";

-- DropForeignKey
ALTER TABLE "latest_trusted_locations" DROP CONSTRAINT "latest_trusted_locations_tripId_fkey";

-- DropForeignKey
ALTER TABLE "latest_trusted_locations" DROP CONSTRAINT "latest_trusted_locations_userId_fkey";

-- DropForeignKey
ALTER TABLE "location_pings" DROP CONSTRAINT "location_pings_tripId_fkey";

-- DropForeignKey
ALTER TABLE "location_pings" DROP CONSTRAINT "location_pings_userId_fkey";

-- DropForeignKey
ALTER TABLE "safety_alerts" DROP CONSTRAINT "safety_alerts_tripId_fkey";

-- DropForeignKey
ALTER TABLE "safety_alerts" DROP CONSTRAINT "safety_alerts_userId_fkey";

-- DropForeignKey
ALTER TABLE "sos_requests" DROP CONSTRAINT "sos_requests_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "sos_requests" DROP CONSTRAINT "sos_requests_tripId_fkey";

-- DropForeignKey
ALTER TABLE "sos_requests" DROP CONSTRAINT "sos_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "trip_check_ins" DROP CONSTRAINT "trip_check_ins_tripId_fkey";

-- DropForeignKey
ALTER TABLE "trip_check_ins" DROP CONSTRAINT "trip_check_ins_userId_fkey";

-- DropForeignKey
ALTER TABLE "trip_participant_consents" DROP CONSTRAINT "trip_participant_consents_tripId_fkey";

-- DropForeignKey
ALTER TABLE "trip_participant_consents" DROP CONSTRAINT "trip_participant_consents_userId_fkey";

-- CreateTable
CREATE TABLE "destinations" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "state" VARCHAR(120) NOT NULL,
    "country" VARCHAR(80) NOT NULL DEFAULT 'India',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(500),
    "imageUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_name_key" ON "destinations"("name");

-- CreateIndex
CREATE INDEX "destinations_active_featured_sortOrder_idx" ON "destinations"("active", "featured", "sortOrder");

-- CreateIndex
CREATE INDEX "destinations_name_idx" ON "destinations"("name");
