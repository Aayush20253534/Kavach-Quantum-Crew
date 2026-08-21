CREATE TYPE "NotificationDeliveryChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP');
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'RETRY_SCHEDULED');

CREATE TABLE "notification_deliveries" (
  "id" UUID NOT NULL,
  "notificationId" UUID NOT NULL,
  "channel" "NotificationDeliveryChannel" NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attemptsCount" INTEGER NOT NULL DEFAULT 0,
  "provider" VARCHAR(80),
  "externalId" VARCHAR(200),
  "nextAttemptAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "lastErrorCode" VARCHAR(100),
  "lastErrorMessage" VARCHAR(500),
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_delivery_attempts" (
  "id" UUID NOT NULL,
  "deliveryId" UUID NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL,
  "provider" VARCHAR(80),
  "externalId" VARCHAR(200),
  "errorCode" VARCHAR(100),
  "errorMessage" VARCHAR(500),
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_delivery_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_deliveries_notificationId_channel_key" ON "notification_deliveries"("notificationId", "channel");
CREATE INDEX "notification_deliveries_status_nextAttemptAt_idx" ON "notification_deliveries"("status", "nextAttemptAt");
CREATE INDEX "notification_deliveries_notificationId_createdAt_idx" ON "notification_deliveries"("notificationId", "createdAt");
CREATE UNIQUE INDEX "notification_delivery_attempts_deliveryId_attemptNumber_key" ON "notification_delivery_attempts"("deliveryId", "attemptNumber");
CREATE INDEX "notification_delivery_attempts_deliveryId_attemptedAt_idx" ON "notification_delivery_attempts"("deliveryId", "attemptedAt");

ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_delivery_attempts" ADD CONSTRAINT "notification_delivery_attempts_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "notification_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
