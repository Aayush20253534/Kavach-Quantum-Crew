CREATE TABLE "tourist_trip_credentials" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "publicId" VARCHAR(80) NOT NULL,
  "tokenId" VARCHAR(64) NOT NULL,
  "chainHash" VARCHAR(66) NOT NULL,
  "chainStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "chainTxHash" VARCHAR(80),
  "chainError" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tourist_trip_credentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "group_trip_credentials" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  "publicId" VARCHAR(80) NOT NULL,
  "tokenId" VARCHAR(64) NOT NULL,
  "chainHash" VARCHAR(66) NOT NULL,
  "chainStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "chainTxHash" VARCHAR(80),
  "chainError" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "group_trip_credentials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blockchain_anchor_jobs" (
  "id" UUID NOT NULL,
  "operation" VARCHAR(32) NOT NULL,
  "entityType" VARCHAR(32) NOT NULL,
  "entityId" UUID NOT NULL,
  "payloadHash" VARCHAR(66) NOT NULL,
  "extraArgs" JSONB NOT NULL,
  "state" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "txHash" VARCHAR(80),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "blockchain_anchor_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tourist_trip_credentials_publicId_key" ON "tourist_trip_credentials"("publicId");
CREATE UNIQUE INDEX "tourist_trip_credentials_tokenId_key" ON "tourist_trip_credentials"("tokenId");
CREATE UNIQUE INDEX "tourist_trip_credentials_chainHash_key" ON "tourist_trip_credentials"("chainHash");
CREATE UNIQUE INDEX "tourist_trip_credentials_tripId_userId_key" ON "tourist_trip_credentials"("tripId", "userId");
CREATE INDEX "tourist_trip_credentials_userId_expiresAt_revokedAt_idx" ON "tourist_trip_credentials"("userId", "expiresAt", "revokedAt");
CREATE INDEX "tourist_trip_credentials_chainStatus_updatedAt_idx" ON "tourist_trip_credentials"("chainStatus", "updatedAt");

CREATE UNIQUE INDEX "group_trip_credentials_tripId_key" ON "group_trip_credentials"("tripId");
CREATE UNIQUE INDEX "group_trip_credentials_groupId_key" ON "group_trip_credentials"("groupId");
CREATE UNIQUE INDEX "group_trip_credentials_publicId_key" ON "group_trip_credentials"("publicId");
CREATE UNIQUE INDEX "group_trip_credentials_tokenId_key" ON "group_trip_credentials"("tokenId");
CREATE UNIQUE INDEX "group_trip_credentials_chainHash_key" ON "group_trip_credentials"("chainHash");
CREATE INDEX "group_trip_credentials_expiresAt_revokedAt_idx" ON "group_trip_credentials"("expiresAt", "revokedAt");
CREATE INDEX "group_trip_credentials_chainStatus_updatedAt_idx" ON "group_trip_credentials"("chainStatus", "updatedAt");

CREATE INDEX "blockchain_anchor_jobs_state_availableAt_createdAt_idx" ON "blockchain_anchor_jobs"("state", "availableAt", "createdAt");
CREATE INDEX "blockchain_anchor_jobs_entityType_entityId_idx" ON "blockchain_anchor_jobs"("entityType", "entityId");

ALTER TABLE "tourist_trip_credentials" ADD CONSTRAINT "tourist_trip_credentials_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tourist_trip_credentials" ADD CONSTRAINT "tourist_trip_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_trip_credentials" ADD CONSTRAINT "group_trip_credentials_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_trip_credentials" ADD CONSTRAINT "group_trip_credentials_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "trip_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
