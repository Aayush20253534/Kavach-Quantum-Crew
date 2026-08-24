/**
 * blockchain/adapter/types.ts
 *
 * Shared TypeScript types/enums used across the adapter package.
 * No runtime logic lives here — types only.
 */

// ---------------------------------------------------------------------
// JSON primitive constraint — used by canonicalize.ts / hasher.ts to
// stop callers from accidentally passing non-deterministic values
// (Date objects, undefined, functions, etc.) into a payload that will
// be hashed.
// ---------------------------------------------------------------------
export type JsonPrimitive =
  | string
  | number
  | boolean
  | null
  | JsonPrimitive[]
  | { [key: string]: JsonPrimitive };

// ---------------------------------------------------------------------
// Anchor job bookkeeping
// ---------------------------------------------------------------------

/** The five on-chain operations the job queue knows how to submit. */
export type AnchorType =
  | "ID_ISSUE"
  | "ID_REVOKE"
  | "EVIDENCE"
  | "INCIDENT"
  | "CONSENT";

/** Lifecycle state of a queued anchor job. Mirrors the contract's async
 * confirmation model — PostgreSQL is the source of truth for this state,
 * never the frontend and never blocking the operational workflow. */
export type AnchorState = "PENDING" | "CONFIRMED" | "FAILED";

/**
 * One row in the `blockchain_anchor_jobs` table (schema owned by the
 * backend's Prisma migrations — this module only reads/writes it).
 */
export interface AnchorJob {
  jobId: string;
  anchorType: AnchorType;
  /** The bytes32 hash (0x-prefixed hex) being anchored/issued/revoked. */
  payloadHash: string;
  /** Extra args needed for the specific contract call, e.g. tripHash,
   * issuedAt/expiresAt for ID_ISSUE, or reasonCode for ID_REVOKE. */
  extraArgs: Record<string, unknown>;
  state: AnchorState;
  txHash: string | null;
  attempts: number;
  createdAt: number; // unix epoch seconds
  lastError: string | null;
}

// ---------------------------------------------------------------------
// Verification result shapes
// ---------------------------------------------------------------------

export type IdStatus = "ACTIVE" | "REVOKED" | "EXPIRED" | "NOT_FOUND";

/** Mirrors the exact JSON example in the source blueprint (§6/§13):
 * idHash, status, issuer, issuedAt, expiresAt, chain, contractVersion. */
export interface VerificationResult {
  idHash: string;
  status: IdStatus;
  issuer: string;
  issuedAt: string; // ISO-8601
  expiresAt: string; // ISO-8601
  chain: string;
  contractVersion: string;
}

export interface EvidenceVerificationResult {
  exists: boolean;
  anchoredAt: number; // unix epoch seconds, 0 if not anchored
}

export interface IncidentVerificationResult {
  exists: boolean;
  anchoredAt: number;
}

export interface ConsentVerificationResult {
  exists: boolean;
}

// ---------------------------------------------------------------------
// ChainClient error classes
// ---------------------------------------------------------------------

/** Thrown when a transaction cannot even be submitted (RPC unreachable,
 * bad nonce, insufficient funds). Distinct from a timeout or a revert —
 * the job queue branches on this via instanceof. */
export class ChainSubmissionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ChainSubmissionError";
  }
}

/** Thrown when waiting for a receipt exceeds the timeout — the chain
 * may still confirm it later, so callers should treat this as "stay
 * PENDING and retry," never as a hard failure. */
export class ChainTimeoutError extends Error {
  constructor(message: string, public readonly txHash: string) {
    super(message);
    this.name = "ChainTimeoutError";
  }
}

// ---------------------------------------------------------------------
// Worker loop summary (jobQueue.ts)
// ---------------------------------------------------------------------

export interface WorkerRunSummary {
  submitted: number;
  confirmed: number;
  failed: number;
  skipped: number;
  errors: Array<{ jobId: string; error: string }>;
}

// ---------------------------------------------------------------------
// Privacy scan report (privacyScan.ts)
// ---------------------------------------------------------------------

export interface PrivacyCheckResult {
  label: string;
  passed: boolean;
  details?: string;
}

export interface PrivacyScanReport {
  passed: boolean;
  scannedFromBlock: number;
  scannedToBlock: number;
  eventCount: number;
  checks: PrivacyCheckResult[];
}
