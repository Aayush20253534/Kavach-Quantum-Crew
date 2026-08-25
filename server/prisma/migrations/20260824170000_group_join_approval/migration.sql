CREATE TYPE "GroupJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "group_join_requests" (
  "id" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "groupIdHash" VARCHAR(66) NOT NULL,
  "status" "GroupJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "group_join_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_join_requests_groupId_userId_key" ON "group_join_requests"("groupId", "userId");
CREATE INDEX "group_join_requests_groupId_status_requestedAt_idx" ON "group_join_requests"("groupId", "status", "requestedAt");
CREATE INDEX "group_join_requests_userId_status_requestedAt_idx" ON "group_join_requests"("userId", "status", "requestedAt");

ALTER TABLE "group_join_requests"
  ADD CONSTRAINT "group_join_requests_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "trip_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_join_requests"
  ADD CONSTRAINT "group_join_requests_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
