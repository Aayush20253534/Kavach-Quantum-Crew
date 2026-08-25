import { AnchorJob, AnchorState } from "../types";

/**
 * Translation layer between our internal adapter shapes and the exact
 * contract the backend catalogue (BLOCKCHAIN-CATALOGUE.md) expects.
 * Nothing outside this file should perform these conversions.
 */

const HEX_64_RE = /^[0-9a-fA-F]{64}$/;
const HEX_66_PREFIXED_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Convert our internal "0x"-prefixed 66-char hash into the catalogue's
 * 64-char (no-prefix) payloadHash format.
 */
export function toCatalogueHash(hashWithPrefix: string): string {
  if (!HEX_66_PREFIXED_RE.test(hashWithPrefix)) {
    throw new TypeError(
      `toCatalogueHash: expected a 0x-prefixed 64-hex-char string, got: ${hashWithPrefix}`
    );
  }
  return hashWithPrefix.slice(2);
}

/**
 * Convert the catalogue's 64-char (no-prefix) payloadHash into our
 * internal "0x"-prefixed format used by hasher.ts / chainClient.ts.
 */
export function toChainHash(catalogueHash: string): string {
  if (!HEX_64_RE.test(catalogueHash)) {
    throw new TypeError(
      `toChainHash: expected exactly 64 hex characters (no 0x prefix), got: ${catalogueHash}`
    );
  }
  return "0x" + catalogueHash.toLowerCase();
}

export type CatalogueStatus = "ACCEPTED" | "CONFIRMED" | "FAILED";

export interface CatalogueProofResponse {
  reference: string;
  transactionId: string | null;
  status: CatalogueStatus;
}

function mapState(state: AnchorState): CatalogueStatus {
  switch (state) {
    case "PENDING":
      return "ACCEPTED";
    case "CONFIRMED":
      return "CONFIRMED";
    case "FAILED":
      return "FAILED";
    default: {
      const exhaustiveCheck: never = state;
      throw new Error(`mapState: unhandled AnchorState: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Build the catalogue's recommended proof response shape from an
 * internal AnchorJob record.
 */
export function toProofResponse(job: AnchorJob): CatalogueProofResponse {
  return {
    reference: job.jobId,
    transactionId: job.txHash,
    status: mapState(job.state),
  };
}
