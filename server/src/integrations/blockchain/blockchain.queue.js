import { prisma } from "../../config/database.js";
import { environment } from "../../config/environment.js";
import { blockchainService } from "./blockchain.service.js";

const credentialModel = (db, entityType) =>
  entityType === "GROUP" ? db.groupTripCredential : db.touristTripCredential;

export const blockchainQueue = Object.freeze({
  enqueue({ operation, entityType, entityId, payloadHash, extraArgs = {} }) {
    if (!environment.BLOCKCHAIN_ENABLED) {
      return credentialModel(prisma, entityType).update({
        where: { id: entityId },
        data: { chainStatus: "DISABLED", chainError: null },
      });
    }
    return prisma.blockchainAnchorJob.create({
      data: { operation, entityType, entityId, payloadHash, extraArgs, state: "PENDING" },
    });
  },

  async retryFailed(entityType, entityId) {
    if (!environment.BLOCKCHAIN_ENABLED) return false;

    const job = await prisma.blockchainAnchorJob.findFirst({
      where: { entityType, entityId, state: "FAILED" },
      orderBy: { updatedAt: "desc" },
    });
    if (!job) return false;

    await prisma.$transaction([
      prisma.blockchainAnchorJob.update({
        where: { id: job.id },
        data: { state: "PENDING", attempts: 0, lastError: null, availableAt: new Date() },
      }),
      credentialModel(prisma, entityType).update({
        where: { id: entityId },
        data: { chainStatus: "PENDING", chainError: null },
      }),
    ]);
    return true;
  },

  async processNext() {
    const job = await prisma.blockchainAnchorJob.findFirst({
      where: { state: "PENDING", availableAt: { lte: new Date() } },
      orderBy: { createdAt: "asc" },
    });
    if (!job) return false;

    const claimed = await prisma.blockchainAnchorJob.updateMany({
      where: { id: job.id, state: "PENDING" },
      data: { state: "PROCESSING", attempts: { increment: 1 } },
    });
    if (claimed.count === 0) return true;

    try {
      let result;
      if (job.operation === "ISSUE") result = await blockchainService.issue({ idHash: job.payloadHash, ...job.extraArgs });
      else if (job.operation === "EXTEND") result = await blockchainService.extend({ idHash: job.payloadHash, ...job.extraArgs });
      else if (job.operation === "REVOKE") result = await blockchainService.revoke({ idHash: job.payloadHash, ...job.extraArgs });
      else throw new Error(`Unsupported blockchain operation: ${job.operation}`);

      await prisma.$transaction([
        prisma.blockchainAnchorJob.update({
          where: { id: job.id },
          data: { state: "CONFIRMED", txHash: result.txHash ?? null, lastError: null },
        }),
        credentialModel(prisma, job.entityType).update({
          where: { id: job.entityId },
          data: { chainStatus: "CONFIRMED", chainTxHash: result.txHash ?? null, chainError: null },
        }),
      ]);
    } catch (error) {
      const attempts = job.attempts + 1;
      const failed = attempts >= environment.BLOCKCHAIN_MAX_ATTEMPTS;
      const retryAt = new Date(Date.now() + Math.min(60_000, 2 ** attempts * 1000));
      const message = String(error?.shortMessage || error?.message || error).slice(0, 2000);
      await prisma.$transaction([
        prisma.blockchainAnchorJob.update({
          where: { id: job.id },
          data: { state: failed ? "FAILED" : "PENDING", lastError: message, availableAt: retryAt },
        }),
        credentialModel(prisma, job.entityType).update({
          where: { id: job.entityId },
          data: { chainStatus: failed ? "FAILED" : "PENDING", chainError: message },
        }),
      ]);
    }
    return true;
  },
});
