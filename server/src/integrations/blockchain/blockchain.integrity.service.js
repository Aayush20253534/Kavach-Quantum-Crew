import { prisma } from "../../config/database.js";
import { environment } from "../../config/environment.js";
import { logger } from "../../config/logger.js";
import { realtimePublisher } from "../../realtime/realtimePublisher.js";
import { blockchainQueue } from "./blockchain.queue.js";
import { blockchainService } from "./blockchain.service.js";
import { decryptSnapshot, hashSnapshot } from "./blockchain.snapshot.js";

const openStatuses = ["PLANNED", "ACTIVE"];

const normalizeDate = (value) => value ? new Date(value).toISOString() : null;

const integrityPayload = (credential, status, extra = {}) => ({
  credentialId: credential.id,
  tripId: credential.tripId,
  status,
  checkedAt: new Date().toISOString(),
  ...extra,
});

export const blockchainIntegrityService = Object.freeze({
  async reconcileCredential(credential) {
    if (!environment.BLOCKCHAIN_ENABLED || credential.chainStatus !== "CONFIRMED") return false;

    const snapshotJob = await blockchainQueue.latestSnapshotJob("INDIVIDUAL", credential.id);
    if (!snapshotJob) {
      logger.warn(
        { credentialId: credential.id, tripId: credential.tripId },
        "Blockchain integrity skipped because no individual snapshot job exists",
      );
      realtimePublisher.publishBlockchainIntegrity(
        credential.userId,
        integrityPayload(credential, "INTEGRITY_UNAVAILABLE", {
          message: "No blockchain identity snapshot exists for this credential, so integrity cannot be approved.",
        }),
      );
      return false;
    }

    let latest;
    try {
      // Trust the chain first. A local SNAPSHOT job can be marked FAILED even when the
      // transaction reached Sepolia but the gateway response timed out. Reading the
      // latest snapshot prevents that bookkeeping failure from blocking reconciliation.
      latest = await blockchainService.latestSnapshot(credential.chainHash);
    } catch (error) {
      if (snapshotJob.state === "FAILED") {
        const retried = await blockchainQueue.retryFailedSnapshots("INDIVIDUAL", credential.id);
        logger.warn(
          {
            credentialId: credential.id,
            tripId: credential.tripId,
            retried,
            snapshotJobError: snapshotJob.lastError,
            err: error,
          },
          "Trusted blockchain snapshot unavailable; retrying failed identity snapshot",
        );
      }
      realtimePublisher.publishBlockchainIntegrity(
        credential.userId,
        integrityPayload(credential, "INTEGRITY_UNAVAILABLE", {
          message: "Blockchain integrity snapshot is not currently readable. Protected data cannot be approved until recovery succeeds.",
        }),
      );
      return false;
    }

    if (!latest?.ciphertext || latest.ciphertext === "0x" || Number(latest.sequence || 0) < 1) {
      if (snapshotJob.state === "FAILED") {
        const retried = await blockchainQueue.retryFailedSnapshots("INDIVIDUAL", credential.id);
        logger.warn(
          { credentialId: credential.id, tripId: credential.tripId, retried, snapshotJobError: snapshotJob.lastError },
          "No trusted on-chain identity snapshot yet; retrying failed identity snapshot",
        );
      }
      realtimePublisher.publishBlockchainIntegrity(
        credential.userId,
        integrityPayload(credential, "INTEGRITY_UNAVAILABLE", {
          message: "No confirmed blockchain identity snapshot is available yet.",
        }),
      );
      return false;
    }
    if (Number(latest.snapshotType) !== 1) return false;
    const payload = decryptSnapshot(latest.ciphertext);
    if (hashSnapshot(payload).toLowerCase() !== String(latest.payloadHash).toLowerCase()) {
      throw new Error(`Blockchain snapshot hash mismatch for credential ${credential.id}`);
    }
    if (payload.idHash !== credential.chainHash || payload.tripId !== credential.tripId || payload.userId !== credential.userId) {
      throw new Error(`Blockchain snapshot identity mismatch for credential ${credential.id}`);
    }

    const current = await prisma.touristTripCredential.findUnique({
      where: { id: credential.id },
      include: { user: true, trip: true },
    });
    if (!current || !openStatuses.includes(current.trip.status)) return false;

    const userPatch = {};
    if (current.user.name !== payload.name) userPatch.name = payload.name;
    if (current.user.email !== payload.email) userPatch.email = payload.email;
    if (current.user.phone !== payload.phone) userPatch.phone = payload.phone;
    if (normalizeDate(current.user.dateOfBirth) !== normalizeDate(payload.dateOfBirth)) userPatch.dateOfBirth = new Date(payload.dateOfBirth);
    const destinationChanged = current.trip.locationName !== payload.destination;

    const tamperedFields = [
      ...Object.keys(userPatch),
      ...(destinationChanged ? ["destination"] : []),
    ];

    if (!tamperedFields.length) {
      realtimePublisher.publishBlockchainIntegrity(
        current.userId,
        integrityPayload(current, "VERIFIED", {
          restored: false,
          snapshotSequence: Number(latest.sequence),
          message: "Blockchain integrity approved.",
        }),
      );
      return false;
    }

    const detectedAt = new Date().toISOString();
    realtimePublisher.publishBlockchainIntegrity(
      current.userId,
      integrityPayload(current, "DB_TAMPERED", {
        detectedAt,
        tamperedFields,
        message: "Database tampering detected.",
      }),
    );
    realtimePublisher.publishBlockchainIntegrity(
      current.userId,
      integrityPayload(current, "FIXING", {
        detectedAt,
        tamperedFields,
        message: "Restoring trusted values from the blockchain snapshot.",
      }),
    );

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userPatch).length) await tx.user.update({ where: { id: current.userId }, data: userPatch });
      if (destinationChanged) await tx.trip.update({ where: { id: current.tripId }, data: { locationName: payload.destination } });
      await tx.auditLog.create({ data: {
        actorRole: "SYSTEM_ADMIN",
        action: "BLOCKCHAIN_DB_RESTORED",
        entityType: "TouristTripCredential",
        entityId: current.id,
        metadata: { restoredUserFields: Object.keys(userPatch), restoredDestination: destinationChanged, snapshotSequence: latest.sequence },
      } });
    });

    realtimePublisher.publishBlockchainIntegrity(
      current.userId,
      integrityPayload(current, "FIXED", {
        detectedAt,
        correctedAt: new Date().toISOString(),
        tamperedFields,
        restored: true,
        snapshotSequence: Number(latest.sequence),
        message: "Tampered database values were restored from blockchain.",
      }),
    );
    realtimePublisher.publishBlockchainIntegrity(
      current.userId,
      integrityPayload(current, "VERIFIED", {
        detectedAt,
        correctedAt: new Date().toISOString(),
        tamperedFields,
        restored: true,
        snapshotSequence: Number(latest.sequence),
        message: "Blockchain integrity approved.",
      }),
    );
    return true;
  },

  async reconcileUser(userId) {
    const credential = await prisma.touristTripCredential.findFirst({
      where: { userId, revokedAt: null, chainStatus: "CONFIRMED", trip: { status: { in: openStatuses } } },
      orderBy: { issuedAt: "desc" },
    });
    return credential ? this.reconcileCredential(credential) : false;
  },

  async reconcileAllOpen() {
    if (!environment.BLOCKCHAIN_ENABLED) return 0;
    const credentials = await prisma.touristTripCredential.findMany({
      where: { revokedAt: null, chainStatus: "CONFIRMED", trip: { status: { in: openStatuses } } },
      take: 100,
    });
    let restored = 0;
    for (const credential of credentials) {
      try {
        if (await this.reconcileCredential(credential)) restored += 1;
      } catch (error) {
        logger.error(
          { err: error, credentialId: credential.id, tripId: credential.tripId },
          "Blockchain integrity reconciliation failed; will retry on the next cycle",
        );
      }
    }
    return restored;
  },
});
