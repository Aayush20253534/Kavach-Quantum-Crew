/**
 * blockchain/scripts/anchorIncident.ts
 *
 * Standalone CLI script: anchors a pre-computed incident-timeline
 * snapshot hash on-chain via anchorIncident(). Mirrors anchorEvidence.ts
 * exactly — this script does NOT hash anything (see
 * adapter/hasher.ts::hashIncidentSnapshot) — it only anchors a hash you
 * already have, and reports the idempotency outcome.
 *
 * Usage:
 *   npx ts-node scripts/anchorIncident.ts \
 *     --incidentHash 0xabc... \
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

  const incidentHash = requireArg(args, "incidentHash");
  const version = Number(optionalArg(args, "version", "1"));
  const networkName = args["network"];

  const deployment = loadDeployment(networkName);
  const { contract } = connectContract(deployment);

  const [existedBefore] = await contract.verifyIncident(incidentHash);

  console.error(
    `[anchorIncident] Submitting anchorIncident(incidentHash=${incidentHash}, version=${version})`
  );

  const tx = await contract.anchorIncident(incidentHash, version);
  console.error(`[anchorIncident] Transaction submitted: ${tx.hash}`);

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
      if (parsed && parsed.name === "IncidentAnchored") {
        emitted = {
          incidentHash: parsed.args.incidentHash,
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

  const [existsAfter, anchoredAt] = await contract.verifyIncident(incidentHash);

  printResult({
    ok: true,
    txHash: tx.hash,
    status: "CONFIRMED",
    blockNumber: receipt.blockNumber,
    alreadyAnchored: existedBefore === true,
    event: emitted,
    exists: existsAfter,
    anchoredAt: anchoredAt.toString(),
  });
}

main().catch((error) => {
  printResult({ ok: false, error: error?.message ?? String(error) });
  process.exit(1);
});