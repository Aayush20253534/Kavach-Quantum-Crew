CREATE TABLE "password_reset_otps" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "accountRole" "Role" NOT NULL,
    "codeHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "resetTokenHash" VARCHAR(64),
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_otps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_otps_accountId_accountRole_key"
ON "password_reset_otps"("accountId", "accountRole");

CREATE INDEX "password_reset_otps_expiresAt_idx"
ON "password_reset_otps"("expiresAt");

CREATE INDEX "password_reset_otps_resetTokenHash_idx"
ON "password_reset_otps"("resetTokenHash");
