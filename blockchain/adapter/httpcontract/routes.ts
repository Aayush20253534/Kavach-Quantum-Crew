import { Router, Request, Response, NextFunction } from "express";
import {
  enqueueIssueId,
  enqueueAnchorIncident,
  enqueueAnchorEvidence,
  getJobStatus,
  ChainClient,
} from "../index";
import { hashIdPayload, hashIncidentSnapshot, hashEvidenceManifest } from "../hasher";
import { toCatalogueHash, toChainHash, toProofResponse } from "./formatters";

/**
 * Implements the four endpoints defined in BLOCKCHAIN-CATALOGUE.md.
 * Auth (DISASTER_MANAGER / SYSTEM_ADMIN only) is enforced by middleware
 * supplied by the backend when this router is mounted — not reimplemented
 * here. Mount with:
 *
 *   app.use(
 *     "/api/v1/integrations/blockchain",
 *     requireRole(["DISASTER_MANAGER", "SYSTEM_ADMIN"]),
 *     blockchainRouter
 *   );
 */

const router = Router();
const chainClient = new ChainClient();

const CONTRACT_VERSION_NUM = 1; // must match adapter/CONTRACT_VERSION semantics

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

// -----------------------------------------------------------------
// POST /safety-id-proof
// -----------------------------------------------------------------
router.post(
  "/safety-id-proof",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { safetyId, referenceId, payloadHash, timestamp } = req.body as {
        safetyId: string;
        referenceId: string;
        payloadHash: string;
        timestamp: string | number;
      };

      if (!safetyId || !referenceId || !payloadHash) {
        return res.status(400).json({
          error: "safetyId, referenceId, and payloadHash are required",
        });
      }

      // The caller already computed payloadHash upstream (64 hex chars,
      // no 0x prefix) — we don't re-derive it, we just anchor it.
      const idHash = toChainHash(payloadHash);
      const tripHash = hashIdPayload(0, referenceId, String(CONTRACT_VERSION_NUM), safetyId);
      const issuedAt = typeof timestamp === "number" ? timestamp : nowSeconds();
      const expiresAt = issuedAt + 60 * 60 * 24 * 7; // 7-day default validity window

      const jobId = await enqueueIssueId(
        idHash,
        tripHash,
        issuedAt,
        expiresAt,
        CONTRACT_VERSION_NUM
      );

      const job = await getJobStatus(jobId);
      return res.status(202).json(toProofResponse(job));
    } catch (err) {
      return next(err);
    }
  }
);

// -----------------------------------------------------------------
// POST /incident-proof
// -----------------------------------------------------------------
router.post(
  "/incident-proof",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { incidentId, referenceId, payloadHash, timestamp } = req.body as {
        incidentId: string;
        referenceId: string;
        payloadHash: string;
        timestamp: string | number;
      };

      if (!incidentId || !referenceId || !payloadHash) {
        return res.status(400).json({
          error: "incidentId, referenceId, and payloadHash are required",
        });
      }

      const incidentHash = toChainHash(payloadHash);

      const jobId = await enqueueAnchorIncident(incidentHash, CONTRACT_VERSION_NUM);
      const job = await getJobStatus(jobId);
      return res.status(202).json(toProofResponse(job));
    } catch (err) {
      return next(err);
    }
  }
);

// -----------------------------------------------------------------
// POST /evidence-proof
// -----------------------------------------------------------------
router.post(
  "/evidence-proof",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attachmentId, referenceId, payloadHash, timestamp } = req.body as {
        attachmentId: string;
        referenceId: string;
        payloadHash: string;
        timestamp: string | number;
      };

      if (!attachmentId || !referenceId || !payloadHash) {
        return res.status(400).json({
          error: "attachmentId, referenceId, and payloadHash are required",
        });
      }

      const evidenceHash = toChainHash(payloadHash);

      const jobId = await enqueueAnchorEvidence(evidenceHash, CONTRACT_VERSION_NUM);
      const job = await getJobStatus(jobId);
      return res.status(202).json(toProofResponse(job));
    } catch (err) {
      return next(err);
    }
  }
);

// -----------------------------------------------------------------
// GET /verification/:reference
// -----------------------------------------------------------------
router.get(
  "/verification/:reference",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reference } = req.params;

      const job = await getJobStatus(reference);
      if (!job) {
        return res.status(404).json({ error: "Unknown reference" });
      }

      const base = toProofResponse(job);

      // Once confirmed, enrich with the on-chain read so the caller gets
      // a fully "stable verification response" per the catalogue's
      // blockchain-team responsibility list.
      if (job.state === "CONFIRMED") {
        let onChain: Record<string, unknown> = {};
        try {
          switch (job.anchorType) {
            case "ID_ISSUE":
            case "ID_REVOKE": {
              const result = await chainClient.verifyId(job.payloadHash);
              onChain = { chainStatus: result.status, chain: result.chain };
              break;
            }
            case "INCIDENT": {
              const result = await chainClient.verifyIncident(job.payloadHash);
              onChain = { exists: result.exists, anchoredAt: result.anchoredAt };
              break;
            }
            case "EVIDENCE": {
              const result = await chainClient.verifyEvidence(job.payloadHash);
              onChain = { exists: result.exists, anchoredAt: result.anchoredAt };
              break;
            }
            case "CONSENT": {
              const exists = await chainClient.verifyConsent(job.payloadHash);
              onChain = { exists };
              break;
            }
          }
        } catch {
          // On-chain read failed but the job itself is confirmed — return
          // the base response rather than failing the whole request.
        }
        return res.status(200).json({
          ...base,
          payloadHash: toCatalogueHash(job.payloadHash),
          ...onChain,
        });
      }

      return res.status(200).json(base);
    } catch (err) {
      return next(err);
    }
  }
);

export { router as blockchainCatalogueRouter };
