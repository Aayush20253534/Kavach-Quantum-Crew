/**
 * blockchain/adapter/jobQueue.ts
 *
 * Implements Invariant 4 (SOS/dispatch never blocked on chain
 * confirmation) and Invariant 5 (idempotent anchoring) concretely.
 *
 * This is the module Express route handlers actually call — they call
 * enqueue*() and return immediately; they never call ChainClient
 * directly. A worker loop (runWorkerOnce), driven by a setInterval at
 * process startup, submits queued jobs and polls for confirmation in
 * the background.
 *
 * Durable storage is a PostgreSQL table `blockchain_anchor_jobs`,
 * schema owned by the backend's Prisma migrations — this module only
 * reads/writes it via Prisma Client, it does not own the schema.
 *
 * Expected Prisma model shape (for reference — defined in the backend's
 * schema.prisma, not here):
 *
 *   model BlockchainAnchorJob {
 *     jobId       String   @id @default(uuid())
 *     anchorType  String   // AnchorType
 *     payloadHash String
 *     extraArgs   Json
 *     state       String   // AnchorState
 *     txHash      String?
 *     attempts    Int      @default(0)
 *     createdAt   DateTime @default(now())
 *     lastError   String?
 *   }
 */

import { randomUUID } from "crypto";
import { ChainClient } from "./chainClient";
import {
  ChainSubmissionError,
  ChainTimeoutError,
  type AnchorJob,
  type AnchorType,
  type WorkerRunSummary,
} from "./types";

const MAX_ATTEMPTS = 5;
const RECEIPT_WAIT_TIMEOUT_MS = 15000;

/**
 * Minimal Prisma-like interface this module depends on, so it can be
 * unit-tested with a fake/in-memory implementation without pulling in
 * a real Prisma Client. The backend wires in the real
 * `prisma.blockchainAnchorJob` delegate at startup via `configureStore`.
 */
export interface AnchorJobStore {
  create(job: AnchorJob): Promise<void>;
  findById(jobId: string): Promise<AnchorJob | null>;
  findPending(): Promise<AnchorJob[]>;
  update(jobId: string, patch: Partial<AnchorJob>): Promise<void>;
}

let store: AnchorJobStore | null = null;
let chainClient: ChainClient | null = null;

/** Wires in the real Prisma-backed store and a ChainClient instance.
 * Must be called once at backend startup before enqueue-family
 * functions and runWorkerOnce are used. Kept separate from
 * module-load time so tests can inject fakes. */
export function configure(jobStore: AnchorJobStore, client: ChainClient): void {
  store = jobStore;
  chainClient = client;
}

function requireStore(): AnchorJobStore {
  if (!store) {
    throw new Error(
      "jobQueue: not configured — call configure(store, chainClient) at backend startup before use"
    );
  }
  return store;
}

function requireChainClient(): ChainClient {
  if (!chainClient) {
    throw new Error(
      "jobQueue: not configured — call configure(store, chainClient) at backend startup before use"
    );
  }
  return chainClient;
}

async function createJob(
  anchorType: AnchorType,
  payloadHash: string,
  extraArgs: Record<string, unknown>
): Promise<string> {
  const s = requireStore();
  const jobId = randomUUID();
  const job: AnchorJob = {
    jobId,
    anchorType,
    payloadHash,
    extraArgs,
    state: "PENDING",
    txHash: null,
    attempts: 0,
    createdAt: Math.floor(Date.now() / 1000),
    lastError: null,
  };
  await s.create(job);
  return jobId;
}

// -----------------------------------------------------------------
// Public enqueue functions — the ONLY functions backend route
// handlers should call. Each validates inputs, inserts a PENDING
// row, and returns immediately. None of these call the chain.
// -----------------------------------------------------------------

export async function enqueueIssueId(
  idHash: string,
  tripHash: string,
  issuedAt: number,
  expiresAt: number,
  version: number
): Promise<string> {
  if (!idHash || !tripHash) {
    throw new TypeError("enqueueIssueId: idHash and tripHash are required");
  }
  if (expiresAt <= issuedAt) {
    throw new TypeError("enqueueIssueId: expiresAt must be after issuedAt");
  }
  return createJob("ID_ISSUE", idHash, { tripHash, issuedAt, expiresAt, version });
}

export async function enqueueRevokeId(
  idHash: string,
  reasonCode: number
): Promise<string> {
  if (!idHash) throw new TypeError("enqueueRevokeId: idHash is required");
  return createJob("ID_REVOKE", idHash, { reasonCode });
}

export async function enqueueAnchorEvidence(
  evidenceHash: string,
  version: number
): Promise<string> {
  if (!evidenceHash) {
    throw new TypeError("enqueueAnchorEvidence: evidenceHash is required");
  }
  return createJob("EVIDENCE", evidenceHash, { version });
}

export async function enqueueAnchorIncident(
  incidentHash: string,
  version: number
): Promise<string> {
  if (!incidentHash) {
    throw new TypeError("enqueueAnchorIncident: incidentHash is required");
  }
  return createJob("INCIDENT", incidentHash, { version });
}

export async function enqueueAnchorConsent(
  consentHash: string,
  version: number
): Promise<string> {
  if (!consentHash) {
    throw new TypeError("enqueueAnchorConsent: consentHash is required");
  }
  return createJob("CONSENT", consentHash, { version });
}

/** Read-only lookup — what the backend's GET /digital-ids/:id (or
 * similar) endpoint calls to show PENDING/CONFIRMED/FAILED. Anchor
 * status must always be shown, never hidden. */
export async function getJobStatus(jobId: string): Promise<AnchorJob> {
  const s = requireStore();
  const job = await s.findById(jobId);
  if (!job) {
    throw new Error(`getJobStatus: no job found for jobId=${jobId}`);
  }
  return job;
}

// -----------------------------------------------------------------
// Idempotency guard — checks on-chain state before submitting, so a
// crash between "tx confirmed" and "local row updated" never causes
// a duplicate anchor.
// -----------------------------------------------------------------

async function alreadyAnchoredOnChain(
  client: ChainClient,
  job: AnchorJob
): Promise<boolean> {
  switch (job.anchorType) {
    case "EVIDENCE": {
      const result = await client.verifyEvidence(job.payloadHash);
      return result.exists;
    }
    case "INCIDENT": {
      const result = await client.verifyIncident(job.payloadHash);
      return result.exists;
    }
    case "CONSENT": {
      const result = await client.verifyConsent(job.payloadHash);
      return result.exists;
    }
    case "ID_ISSUE": {
      const result = await client.verifyId(job.payloadHash);
      return result.status !== "NOT_FOUND";
    }
    case "ID_REVOKE": {
      const result = await client.verifyId(job.payloadHash);
      return result.status === "REVOKED";
    }
    default:
      return false;
  }
}

async function submitJob(client: ChainClient, job: AnchorJob): Promise<string> {
  switch (job.anchorType) {
    case "ID_ISSUE":
      return client.issueId(
        job.payloadHash,
        job.extraArgs.tripHash as string,
        job.extraArgs.issuedAt as number,
        job.extraArgs.expiresAt as number,
        job.extraArgs.version as number
      );
    case "ID_REVOKE":
      return client.revokeId(job.payloadHash, job.extraArgs.reasonCode as number);
    case "EVIDENCE":
      return client.anchorEvidence(job.payloadHash, job.extraArgs.version as number);
    case "INCIDENT":
      return client.anchorIncident(job.payloadHash, job.extraArgs.version as number);
    case "CONSENT":
      return client.anchorConsent(job.payloadHash, job.extraArgs.version as number);
    default:
      throw new Error(`submitJob: unknown anchorType ${job.anchorType}`);
  }
}

// -----------------------------------------------------------------
// Worker loop — called on a timer (e.g. every 5s via setInterval at
// process startup). Never throws; a single job's failure must not
// crash the loop or affect other jobs.
// -----------------------------------------------------------------

export async function runWorkerOnce(): Promise<WorkerRunSummary> {
  const s = requireStore();
  const client = requireChainClient();

  const summary: WorkerRunSummary = {
    submitted: 0,
    confirmed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const pendingJobs = await s.findPending();

  for (const job of pendingJobs) {
    try {
      if (!job.txHash) {
        // Not yet submitted. Idempotency guard first: for
        // EVIDENCE/INCIDENT/CONSENT/ID_ISSUE/ID_REVOKE jobs, check if a
        // prior run already got this confirmed on-chain but crashed
        // before updating the local row.
        const already = await alreadyAnchoredOnChain(client, job);
        if (already) {
          await s.update(job.jobId, { state: "CONFIRMED" });
          summary.confirmed++;
          continue;
        }

        try {
          const txHash = await submitJob(client, job);
          await s.update(job.jobId, {
            txHash,
            attempts: job.attempts + 1,
          });
          summary.submitted++;
        } catch (err) {
          const attempts = job.attempts + 1;
          const message =
            err instanceof ChainSubmissionError
              ? err.message
              : (err as Error).message;

          if (attempts >= MAX_ATTEMPTS) {
            await s.update(job.jobId, {
              state: "FAILED",
              attempts,
              lastError: message,
            });
            summary.failed++;
          } else {
            await s.update(job.jobId, {
              attempts,
              lastError: message,
            });
            summary.skipped++;
          }
          summary.errors.push({ jobId: job.jobId, error: message });
        }
        continue;
      }

      // Already submitted, has a txHash — poll for the receipt.
      try {
        const receipt = await client.waitForReceipt(
          job.txHash,
          RECEIPT_WAIT_TIMEOUT_MS
        );
        await s.update(job.jobId, { state: receipt.status });
        if (receipt.status === "CONFIRMED") summary.confirmed++;
        else summary.failed++;
      } catch (err) {
        if (err instanceof ChainTimeoutError) {
          // Chain-outage resilience case: stay PENDING, retry on next
          // poll. This is expected and not logged as a hard error.
          summary.skipped++;
        } else {
          const message = (err as Error).message;
          await s.update(job.jobId, {
            state: "FAILED",
            lastError: message,
          });
          summary.failed++;
          summary.errors.push({ jobId: job.jobId, error: message });
        }
      }
    } catch (err) {
      // Catch-all so one job's unexpected failure never crashes the
      // loop or affects other jobs.
      summary.errors.push({
        jobId: job.jobId,
        error: (err as Error).message ?? String(err),
      });
    }
  }

  return summary;
}

/**
 * Starts the worker loop on a fixed interval. Call once at backend
 * process boot (e.g. in server.ts) after configure(). Returns the
 * interval handle so callers can clearInterval() during graceful
 * shutdown or in tests.
 */
export function startWorkerLoop(intervalMs = 5000): ReturnType<typeof setInterval> {
  return setInterval(() => {
    runWorkerOnce().catch((err) => {
      // runWorkerOnce is designed to never throw, but guard anyway —
      // an uncaught rejection here must never take down the process.
      // eslint-disable-next-line no-console
      console.error("jobQueue: unexpected worker loop error", err);
    });
  }, intervalMs);
}
