CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'CLOSED');
CREATE TYPE "GroupMemberRole" AS ENUM ('LEADER', 'MEMBER');

CREATE TABLE "trip_groups" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "leaderId" UUID NOT NULL,
  "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "trip_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "trip_groups_tripId_key" ON "trip_groups"("tripId");
CREATE INDEX "trip_groups_leaderId_status_idx" ON "trip_groups"("leaderId", "status");
ALTER TABLE "trip_groups" ADD CONSTRAINT "trip_groups_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_groups" ADD CONSTRAINT "trip_groups_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "group_members" (
  "id" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");
CREATE INDEX "group_members_userId_leftAt_idx" ON "group_members"("userId", "leftAt");
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "trip_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "group_invitations" (
  "id" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  "code" VARCHAR(32) NOT NULL,
  "tokenHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "group_invitations_code_key" ON "group_invitations"("code");
CREATE UNIQUE INDEX "group_invitations_tokenHash_key" ON "group_invitations"("tokenHash");
CREATE INDEX "group_invitations_groupId_expiresAt_revokedAt_idx" ON "group_invitations"("groupId", "expiresAt", "revokedAt");
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "trip_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
