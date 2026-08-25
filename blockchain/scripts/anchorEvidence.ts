/**
 * blockchain/scripts/anchorEvidence.ts
 *
 * Standalone CLI script: anchors a pre-computed evidence manifest hash
 * on-chain via anchorEvidence(). This script does NOT hash anything —
 * hashing happens in adapter/hasher.ts (hashEvidenceManifest). It only
 * anchors a hash you already have, and reports whether the anchor was
 * newly created or already existed (idempotency — Invariant 5).
 *
 * Usage:
 *   npx ts-node scripts/anchorEvidence.ts \
 *     --evidenceHash 0xabc... \
 *     [--version 1] \
 *     [--network hardhat]
 */

import {
  parseArgs,
  requireArg,
  optionalArg,
  loadDeployment,
  connectContract,
  printResult,
} from "./_shared";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const evidenceHash = requireArg(args, "evidenceHash");
  const version = Number(optionalArg(args, "version", "1"));
  const networkName = args["network"];

  const deployment = loadDeployment(networkName);
  const { contract } = connectContract(deployment);

  // Check idempotency state BEFORE submitting, so we can report accurately
  // even though the contract itself would just no-op silently.
  const [existedBefore] = await contract.verifyEvidence(evidenceHash);

  console.error(
    `[anchorEvidence] Submitting anchorEvidence(evidenceHash=${evidenceHash}, version=${version})`
  );

  const tx = await contract.anchorEvidence(evidenceHash, version);
  console.error(`[anchorEvidence] Transaction submitted: ${tx.hash}`);

  const receipt = await tx.wait(1);

  if (!receipt || receipt.status !== 1) {
    printResult({
      ok: false,
      txHash: tx.hash,
      status: "FAILED",
      error: "Transaction reverted or receipt unavailable.",
    });
    process.exit(1);
  }

  const iface = contract.interface;
  let emitted: Record<string, unknown> | null = null;

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "EvidenceAnchored") {
        emitted = {
          evidenceHash: parsed.args.evidenceHash,
          actor: parsed.args.actor,
          anchoredAt: parsed.args.anchoredAt.toString(),
          version: parsed.args.version,
        };
        break;
      }
    } catch {
      continue;
    }
  }

  const [existsAfter, anchoredAt] = await contract.verifyEvidence(evidenceHash);

  printResult({
    ok: true,
    txHash: tx.hash,
    status: "CONFIRMED",
    blockNumber: receipt.blockNumber,
    alreadyAnchored: existedBefore === true,
    event: emitted, // null if this call was a no-op (already anchored)
    exists: existsAfter,
    anchoredAt: anchoredAt.toString(),
  });
}

main().catch((error) => {
  printResult({ ok: false, error: error?.message ?? String(error) });
  process.exit(1);
});