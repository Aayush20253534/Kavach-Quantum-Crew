CREATE TYPE "SignalLossCaseStatus" AS ENUM ('WAITING_FOR_LEADER', 'ESCALATED', 'FALSE_ALARM', 'RESOLVED');
CREATE TYPE "SignalLossLeaderResponse" AS ENUM ('FALSE_ALARM', 'CONFIRMED_DANGER');

CREATE TABLE "signal_loss_cases" (
  "id" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "groupId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "leaderId" UUID NOT NULL,
  "status" "SignalLossCaseStatus" NOT NULL DEFAULT 'WAITING_FOR_LEADER',
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responseDeadlineAt" TIMESTAMP(3) NOT NULL,
  "nextReminderAt" TIMESTAMP(3) NOT NULL,
  "lastNotifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaderResponse" "SignalLossLeaderResponse",
  "leaderRespondedAt" TIMESTAMP(3),
  "escalatedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "incidentId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "signal_loss_cases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "signal_loss_cases_status_responseDeadlineAt_idx" ON "signal_loss_cases"("status", "responseDeadlineAt");
CREATE INDEX "signal_loss_cases_status_nextReminderAt_idx" ON "signal_loss_cases"("status", "nextReminderAt");
CREATE INDEX "signal_loss_cases_tripId_userId_status_idx" ON "signal_loss_cases"("tripId", "userId", "status");
