import { prisma } from "../../config/database.js";
import { environment } from "../../config/environment.js";
import { blockchainFailure, blockchainService } from "./blockchain.service.js";

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
      else if (job.operation === "SNAPSHOT") result = await blockchainService.appendSnapshot({ idHash: job.payloadHash, ...job.extraArgs });
      else throw new Error(`Unsupported blockchain operation: ${job.operation}`);

      const successOps = [
        prisma.blockchainAnchorJob.update({
          where: { id: job.id },
          data: { state: "CONFIRMED", txHash: result.txHash ?? null, lastError: null },
        }),
      ];
      if (job.operation !== "SNAPSHOT") {
        successOps.push(credentialModel(prisma, job.entityType).update({
          where: { id: job.entityId },
          data: { chainStatus: "CONFIRMED", chainTxHash: result.txHash ?? null, chainError: null },
        }));
      }
      await prisma.$transaction(successOps);
    } catch (error) {
      const attempts = job.attempts + 1;
      const failed = attempts >= environment.BLOCKCHAIN_MAX_ATTEMPTS;
      const retryAt = new Date(Date.now() + Math.min(60_000, 2 ** attempts * 1000));
      const failure = blockchainFailure(error);
      const failureText = JSON.stringify({
        code: failure.code,
        message: failure.message,
        retryable: failure.retryable,
        httpStatus: failure.status,
        attempts,
        maxAttempts: environment.BLOCKCHAIN_MAX_ATTEMPTS,
        lastAttemptAt: new Date().toISOString(),
      });
      const failureOps = [
        prisma.blockchainAnchorJob.update({
          where: { id: job.id },
          data: { state: failed ? "FAILED" : "PENDING", lastError: failureText, availableAt: retryAt },
        }),
      ];
      if (job.operation !== "SNAPSHOT") {
        failureOps.push(credentialModel(prisma, job.entityType).update({
          where: { id: job.entityId },
          data: { chainStatus: failed ? "FAILED" : "PENDING", chainError: failureText },
        }));
      }
      await prisma.$transaction(failureOps);
    }
    return true;
  },
});
