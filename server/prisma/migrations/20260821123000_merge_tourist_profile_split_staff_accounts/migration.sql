-- Revised Phase 1 identity layout:
-- 1) users contains tourist account + onboarding/profile fields.
-- 2) Disaster Management and System Admin accounts live in separate tables.
-- 3) auth_sessions is polymorphic across the three account tables.

CREATE TABLE "disaster_managers" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "username" VARCHAR(40) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "organization" VARCHAR(160),
  "jurisdiction" VARCHAR(160),
  "staffInfo" TEXT,
  "lastLoginAt" TIMESTAMP(3),
  "passwordChangedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "disaster_managers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_admins" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "username" VARCHAR(40) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastLoginAt" TIMESTAMP(3),
  "passwordChangedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "system_admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "disaster_managers_username_key" ON "disaster_managers"("username");
CREATE UNIQUE INDEX "disaster_managers_email_key" ON "disaster_managers"("email");
CREATE UNIQUE INDEX "disaster_managers_phone_key" ON "disaster_managers"("phone");
CREATE INDEX "disaster_managers_status_idx" ON "disaster_managers"("status");
CREATE UNIQUE INDEX "system_admins_username_key" ON "system_admins"("username");
CREATE UNIQUE INDEX "system_admins_email_key" ON "system_admins"("email");
CREATE UNIQUE INDEX "system_admins_phone_key" ON "system_admins"("phone");
CREATE INDEX "system_admins_status_idx" ON "system_admins"("status");

ALTER TABLE "users"
  ADD COLUMN "profilePicUrl" TEXT,
  ADD COLUMN "gender" "Gender",
  ADD COLUMN "age" INTEGER,
  ADD COLUMN "medicalHistory" TEXT,
  ADD COLUMN "emergencyPhone" VARCHAR(20),
  ADD COLUMN "nationality" VARCHAR(80);

-- Move tourist-only profile values onto users.
UPDATE "users" u
SET
  "profilePicUrl" = p."profilePicUrl",
  "gender" = p."gender",
  "age" = p."age",
  "medicalHistory" = p."medicalHistory",
  "emergencyPhone" = p."emergencyPhone",
  "nationality" = p."nationality"
FROM "tourist_profiles" p
WHERE p."userId" = u."id";

-- Move existing staff rows out of users before the role column is removed.
INSERT INTO "disaster_managers" (
  "id", "name", "username", "email", "phone", "passwordHash", "status",
  "lastLoginAt", "passwordChangedAt", "createdAt", "updatedAt"
)
SELECT
  "id", "name", "username", "email", "phone", "passwordHash", "status",
  "lastLoginAt", "passwordChangedAt", "createdAt", "updatedAt"
FROM "users"
WHERE "role" = 'DISASTER_MANAGER';

INSERT INTO "system_admins" (
  "id", "name", "username", "email", "phone", "passwordHash", "status",
  "lastLoginAt", "passwordChangedAt", "createdAt", "updatedAt"
)
SELECT
  "id", "name", "username", "email", "phone", "passwordHash", "status",
  "lastLoginAt", "passwordChangedAt", "createdAt", "updatedAt"
FROM "users"
WHERE "role" = 'SYSTEM_ADMIN';

-- Replace user_sessions with a shared session table that records account role.
CREATE TABLE "auth_sessions" (
  "id" UUID NOT NULL,
  "accountId" UUID NOT NULL,
  "accountRole" "Role" NOT NULL,
  "refreshTokenHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "userAgent" VARCHAR(512),
  "ipAddress" VARCHAR(64),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

INSERT INTO "auth_sessions" (
  "id", "accountId", "accountRole", "refreshTokenHash", "expiresAt", "revokedAt",
  "userAgent", "ipAddress", "createdAt", "updatedAt"
)
SELECT
  s."id", s."userId", u."role", s."refreshTokenHash", s."expiresAt", s."revokedAt",
  s."userAgent", s."ipAddress", s."createdAt", s."updatedAt"
FROM "user_sessions" s
JOIN "users" u ON u."id" = s."userId";

CREATE UNIQUE INDEX "auth_sessions_refreshTokenHash_key" ON "auth_sessions"("refreshTokenHash");
CREATE INDEX "auth_sessions_accountId_accountRole_revokedAt_idx"
  ON "auth_sessions"("accountId", "accountRole", "revokedAt");
CREATE INDEX "auth_sessions_expiresAt_idx" ON "auth_sessions"("expiresAt");

-- Audit actors can now belong to any of the three account tables.
ALTER TABLE "audit_logs" ADD COLUMN "actorRole" "Role";
UPDATE "audit_logs" a
SET "actorRole" = u."role"
FROM "users" u
WHERE a."actorId" = u."id";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actorId_fkey";
DROP INDEX IF EXISTS "audit_logs_actorId_createdAt_idx";
CREATE INDEX "audit_logs_actorId_actorRole_createdAt_idx"
  ON "audit_logs"("actorId", "actorRole", "createdAt");

DROP TABLE "user_sessions";
DROP TABLE "tourist_profiles";

DELETE FROM "users" WHERE "role" IN ('DISASTER_MANAGER', 'SYSTEM_ADMIN');
DROP INDEX IF EXISTS "users_role_status_idx";
ALTER TABLE "users" DROP COLUMN "role";
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE INDEX "users_nationality_idx" ON "users"("nationality");
