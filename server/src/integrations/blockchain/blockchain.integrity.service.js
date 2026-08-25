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
      return false;
    }

    if (snapshotJob.state === "FAILED") {
      const retried = await blockchainQueue.retryFailedSnapshots("INDIVIDUAL", credential.id);
      logger.warn(
        { credentialId: credential.id, tripId: credential.tripId, retried },
        "Retrying failed blockchain identity snapshot before integrity reconciliation",
      );
      return false;
    }

    if (snapshotJob.state !== "CONFIRMED") return false;

    const latest = await blockchainService.latestSnapshot(credential.chainHash);
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

    if (!tamperedFields.length) return false;

    const detectedAt = new Date().toISOString();
    realtimePublisher.publishBlockchainIntegrity(
      current.userId,
      integrityPayload(current, "DB_TAMPERED", {
        detectedAt,
        tamperedFields,
        message: "Database tampering detected. Restoring trusted values from blockchain.",
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
      integrityPayload(current, "VERIFIED", {
        detectedAt,
        correctedAt: new Date().toISOString(),
        tamperedFields,
        restored: true,
        snapshotSequence: Number(latest.sequence),
        message: "Database values restored from blockchain and verified.",
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
