/**
 * blockchain/adapter/hasher.ts
 *
 * Turns canonical bytes into the 0x-prefixed hex digest the contract
 * expects, with optional salting for low-entropy fields. Uses Node's
 * built-in `crypto` module — no extra dependency needed for SHA-256.
 *
 * Salting policy: any payload whose entropy is dominated by a short or
 * sequential identifier (a tourist's internal sequence number, a short
 * trip code) MUST pass a per-record random salt, generated once at
 * record-creation time and stored in PostgreSQL alongside the record —
 * never on-chain, never derivable from the hash alone. Payloads that are
 * already high-entropy (e.g. contain a UUID / file checksum) do not
 * strictly need salting.
 */

import * as crypto from "crypto";
import { canonicalize } from "./canonicalize";
import type { JsonPrimitive } from "./types";

/**
 * Core hashing primitive. Canonicalizes the payload, optionally prepends
 * a salt to the raw bytes before hashing, and returns a 0x-prefixed
 * SHA-256 hex digest suitable for a Solidity `bytes32` parameter.
 */
export function hashPayload(
  payload: Record<string, JsonPrimitive>,
  version: string,
  salt?: string
): string {
  let raw: Buffer = canonicalize(payload, version);

  if (salt) {
    raw = Buffer.concat([Buffer.from(salt, "utf-8"), raw]);
  }

  const digest = crypto.createHash("sha256").update(raw).digest("hex");
  return "0x" + digest;
}

/**
 * Digital-ID payload hash. `salt` is REQUIRED (not optional) in this
 * wrapper's own type signature so call sites can't accidentally skip
 * salting for the low-entropy `touristIdSeq` field.
 */
export function hashIdPayload(
  touristIdSeq: number,
  tripId: string,
  version: string,
  salt: string
): string {
  if (!salt || salt.length === 0) {
    throw new TypeError(
      "hashIdPayload: salt is required — touristIdSeq is a low-entropy identifier and must be salted before hashing"
    );
  }
  const payload: Record<string, JsonPrimitive> = { touristIdSeq, tripId };
  return hashPayload(payload, version, salt);
}

/**
 * Evidence manifest hash. No salt needed — a file checksum is already
 * high-entropy.
 */
export function hashEvidenceManifest(
  fileChecksumSha256: string,
  actorId: string,
  orgId: string,
  transferredAt: number,
  version: string
): string {
  const payload: Record<string, JsonPrimitive> = {
    fileChecksumSha256,
    actorId,
    orgId,
    transferredAt,
  };
  return hashPayload(payload, version);
}

/**
 * One incident-timeline state-transition snapshot hash.
 */
export function hashIncidentSnapshot(
  incidentId: string,
  state: string,
  transitionedAt: number,
  actorId: string,
  version: string
): string {
  const payload: Record<string, JsonPrimitive> = {
    incidentId,
    state,
    transitionedAt,
    actorId,
  };
  return hashPayload(payload, version);
}

/**
 * Consent / access receipt hash, keyed to (tripId, consentVersion,
 * sharingWindow) per the source blueprint's §7 pattern.
 */
export function hashConsentReceipt(
  tripId: string,
  consentVersion: string,
  orgId: string,
  role: string,
  windowStart: number,
  windowEnd: number,
  version: string
): string {
  const payload: Record<string, JsonPrimitive> = {
    tripId,
    consentVersion,
    orgId,
    role,
    windowStart,
    windowEnd,
  };
  return hashPayload(payload, version);
}
