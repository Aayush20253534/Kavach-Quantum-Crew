/**
 * blockchain/adapter/privacyScan.ts
 *
 * Automates the "on-chain inspection checklist" — mechanically confirms
 * no PII/GPS/free-text ever reached the chain, by inspecting both the
 * ABI's structural field types (so a future accidental contract change
 * that adds a string field is caught even before any bad data is
 * written) and the decoded values of recently emitted events.
 *
 * Run standalone before every demo:
 *   npx ts-node adapter/privacyScan.ts
 *
 * Also returns a structured report for an optional CI / Jest assertion.
 */

import { ethers } from "ethers";
import { ChainClient } from "./chainClient";
import type { PrivacyCheckResult, PrivacyScanReport } from "./types";

/** Event names this contract emits — every one must be scanned. */
const ANCHOR_EVENT_NAMES = [
  "IdIssued",
  "IdRevoked",
  "EvidenceAnchored",
  "IncidentAnchored",
  "ConsentAnchored",
] as const;

/** The only Solidity types allowed in any anchor-event field: a hash,
 * an address, or a small fixed-width integer (timestamp/code/version).
 * Anything else — string, bytes, bytes[] etc — is structurally
 * forbidden and fails the scan immediately. */
const ALLOWED_FIELD_TYPES = new Set([
  "bytes32",
  "address",
  "uint8",
  "uint64",
  "uint256", // tolerated in case of future widening, still not PII-shaped
]);

function checkAbiFieldTypes(contract: ethers.Contract): PrivacyCheckResult {
  const violations: string[] = [];

  for (const eventName of ANCHOR_EVENT_NAMES) {
    const fragment = contract.interface.getEvent(eventName);
    if (!fragment) {
      violations.push(`event "${eventName}" not found in ABI`);
      continue;
    }
    for (const input of fragment.inputs) {
      // Reject any variable-length type (string, bytes, arrays of
      // either) structurally, regardless of what data is ever put in it.
      const isVariableLength =
        input.type === "string" ||
        input.type === "bytes" ||
        input.type.endsWith("[]");
      if (isVariableLength || !ALLOWED_FIELD_TYPES.has(input.type)) {
        violations.push(
          `event "${eventName}" field "${input.name}" has disallowed type "${input.type}"`
        );
      }
    }
  }

  return {
    label: "No evidence file bytes / free-text on-chain (structural ABI check)",
    passed: violations.length === 0,
    details: violations.length > 0 ? violations.join("; ") : undefined,
  };
}

function checkNoStringOrBytesReasonField(contract: ethers.Contract): PrivacyCheckResult {
  // Specifically re-verify IdRevoked has no string field for the
  // revocation reason — only a numeric reasonCode.
  const fragment = contract.interface.getEvent("IdRevoked");
  const reasonField = fragment?.inputs.find((i) => i.name === "reasonCode");
  const passed =
    !!reasonField &&
    (reasonField.type === "uint8" || reasonField.type.startsWith("uint"));

  return {
    label: "Reason text for revocation is off-chain; only reasonCode is anchored",
    passed,
    details: passed
      ? undefined
      : `IdRevoked.reasonCode field missing or not a uint type (found: ${reasonField?.type ?? "MISSING"})`,
  };
}

function checkVersionFieldPresent(contract: ethers.Contract): PrivacyCheckResult {
  const eventsRequiringVersion = [
    "IdIssued",
    "EvidenceAnchored",
    "IncidentAnchored",
    "ConsentAnchored",
  ];
  const missing: string[] = [];

  for (const eventName of eventsRequiringVersion) {
    const fragment = contract.interface.getEvent(eventName);
    const hasVersion = fragment?.inputs.some((i) => i.name === "version");
    if (!hasVersion) missing.push(eventName);
  }

  return {
    label: "Every anchor carries a version",
    passed: missing.length === 0,
    details: missing.length > 0 ? `missing version field: ${missing.join(", ")}` : undefined,
  };
}

/**
 * Heuristic (best-effort, not a structural guarantee) re-check of
 * decoded bytes32 values from recent events: flags anything that
 * looks like it might be raw ASCII (e.g. a name or short string
 * accidentally passed where a hash was expected) rather than
 * high-entropy hash bytes.
 */
function looksLikeSuspiciousAsciiHash(hexValue: string): boolean {
  const clean = hexValue.startsWith("0x") ? hexValue.slice(2) : hexValue;
  const bytes = Buffer.from(clean, "hex");
  let printableCount = 0;
  for (const byte of bytes) {
    if (byte >= 0x20 && byte <= 0x7e) printableCount++;
  }
  // A genuine SHA-256 digest is high-entropy; if a large majority of
  // bytes fall in printable ASCII range, that's suspicious (real
  // hashes will only hit this by pure chance extremely rarely).
  return bytes.length > 0 && printableCount / bytes.length > 0.85;
}

async function checkRecentEventPayloadsHeuristic(
  contract: ethers.Contract,
  fromBlock: number
): Promise<PrivacyCheckResult> {
  const suspicious: string[] = [];

  for (const eventName of ANCHOR_EVENT_NAMES) {
    const filter = contract.filters[eventName]?.();
    if (!filter) continue;
    const events = await contract.queryFilter(filter, fromBlock, "latest");

    for (const event of events) {
      if (!("args" in event) || !event.args) continue;
      for (const [key, value] of Object.entries(event.args)) {
        if (typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value)) {
          if (looksLikeSuspiciousAsciiHash(value)) {
            suspicious.push(
              `${eventName}.${key} at tx ${event.transactionHash} looks like ASCII, not a hash`
            );
          }
        }
      }
    }
  }

  return {
    label: "No name/phone/contact or raw GPS coordinate in any anchored payload (heuristic scan)",
    passed: suspicious.length === 0,
    details: suspicious.length > 0 ? suspicious.join("; ") : undefined,
  };
}

/**
 * Runs the full privacy scan against recently emitted events.
 *
 * @param client - a configured ChainClient
 * @param sinceBlock - block to scan from (default: genesis / 0)
 */
export async function scanRecentEvents(
  client: ChainClient,
  sinceBlock = 0
): Promise<PrivacyScanReport> {
  const contract = client.getRawContract();
  const provider = client.getProvider();
  const latestBlock = await provider.getBlockNumber();

  const checks: PrivacyCheckResult[] = [];

  // Structural checks (don't require any events to have been emitted).
  checks.push(checkAbiFieldTypes(contract));
  checks.push(checkNoStringOrBytesReasonField(contract));
  checks.push(checkVersionFieldPresent(contract));

  // Heuristic checks over actual emitted data.
  const heuristicResult = await checkRecentEventPayloadsHeuristic(contract, sinceBlock);
  checks.push(heuristicResult);

  // Fifth checklist bullet ("no evidence file bytes on-chain — checksum
  // only") is covered by the structural ABI check above, since
  // EvidenceAnchored has no variable-length field to hold bytes in the
  // first place.
  checks.push({
    label: "No evidence file bytes on-chain (checksum only)",
    passed: checks[0].passed,
    details: checks[0].passed
      ? "EvidenceAnchored event has no variable-length field capable of holding file bytes"
      : "see structural ABI check above",
  });

  let eventCount = 0;
  for (const eventName of ANCHOR_EVENT_NAMES) {
    const filter = contract.filters[eventName]?.();
    if (!filter) continue;
    const events = await contract.queryFilter(filter, sinceBlock, "latest");
    eventCount += events.length;
  }

  const passed = checks.every((c) => c.passed);

  return {
    passed,
    scannedFromBlock: sinceBlock,
    scannedToBlock: latestBlock,
    eventCount,
    checks,
  };
}

// -----------------------------------------------------------------
// CLI entry point: `npx ts-node adapter/privacyScan.ts`
// -----------------------------------------------------------------

function printReport(report: PrivacyScanReport): void {
  console.log("\n=== On-Chain Privacy Inspection ===\n");
  console.log(
    `Scanned blocks ${report.scannedFromBlock} -> ${report.scannedToBlock} (${report.eventCount} events)\n`
  );
  for (const check of report.checks) {
    const mark = check.passed ? "✅" : "❌";
    console.log(`${mark} ${check.label}`);
    if (!check.passed && check.details) {
      console.log(`   details: ${check.details}`);
    }
  }
  console.log(`\nOverall: ${report.passed ? "PASSED" : "FAILED"}\n`);
}

if (require.main === module) {
  (async () => {
    try {
      const client = new ChainClient();
      const report = await scanRecentEvents(client, 0);
      printReport(report);
      process.exit(report.passed ? 0 : 1);
    } catch (err) {
      console.error("privacyScan: fatal error", err);
      process.exit(2);
    }
  })();
}
