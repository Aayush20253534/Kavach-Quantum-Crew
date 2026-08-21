ALTER TABLE "users"
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Existing accounts predate email verification. Preserve their access.
UPDATE "users" SET "emailVerifiedAt" = CURRENT_TIMESTAMP WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "email_verification_otps" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "codeHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_verification_otps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_otps_userId_key"
ON "email_verification_otps"("userId");

CREATE INDEX "email_verification_otps_expiresAt_idx"
ON "email_verification_otps"("expiresAt");

ALTER TABLE "email_verification_otps"
ADD CONSTRAINT "email_verification_otps_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
