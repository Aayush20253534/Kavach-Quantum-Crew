/**
 * blockchain/adapter/index.ts
 *
 * Barrel file exposing the package's public surface. This is what the
 * Node/Express backend imports:
 *
 *   import { enqueueAnchorEvidence, getJobStatus, hashEvidenceManifest }
 *     from "../../blockchain/adapter";
 *
 * Internal helpers not meant for external use (e.g. stableStringify,
 * assertJsonPrimitive, submitJob, alreadyAnchoredOnChain) are NOT
 * re-exported here.
 */

// Canonicalization
export { canonicalize } from "./canonicalize";

// Hashing
export {
  hashPayload,
  hashIdPayload,
  hashEvidenceManifest,
  hashIncidentSnapshot,
  hashConsentReceipt,
} from "./hasher";

// Chain client
export { ChainClient } from "./chainClient";

// Job queue — the functions backend route handlers actually call
export {
  enqueueIssueId,
  enqueueRevokeId,
  enqueueAnchorEvidence,
  enqueueAnchorIncident,
  enqueueAnchorConsent,
  getJobStatus,
  runWorkerOnce,
  startWorkerLoop,
  configure as configureJobQueue,
  type AnchorJobStore,
} from "./jobQueue";

// Privacy scan
export { scanRecentEvents } from "./privacyScan";

// Shared types
export type {
  JsonPrimitive,
  AnchorType,
  AnchorState,
  AnchorJob,
  IdStatus,
  VerificationResult,
  EvidenceVerificationResult,
  IncidentVerificationResult,
  ConsentVerificationResult,
  WorkerRunSummary,
  PrivacyCheckResult,
  PrivacyScanReport,
} from "./types";

export { ChainSubmissionError, ChainTimeoutError } from "./types";
