/**
 * blockchain/scripts/revoke.ts
 *
 * Standalone CLI script: revokes an active digital ID. Reason TEXT never
 * leaves this script / never reaches the chain — only a numeric
 * reasonCode is anchored (free-text reasons stay in PostgreSQL).
 *
 * Usage:
 *   npx ts-node scripts/revoke.ts \
 *     --idHash 0xabc... \
 *     --reasonCode 3 \
 *     [--network hardhat]
 */

import {
  parseArgs,
  requireArg,
  loadDeployment,
  connectContract,
  printResult,
} from "./_shared";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const idHash = requireArg(args, "idHash");
  const reasonCode = Number(requireArg(args, "reasonCode"));
  const networkName = args["network"];

  if (!Number.isInteger(reasonCode) || reasonCode < 0 || reasonCode > 255) {
    throw new Error("--reasonCode must be an integer between 0 and 255 (uint8).");
  }

  const deployment = loadDeployment(networkName);
  const { contract } = connectContract(deployment);

  console.error(`[revoke] Submitting revokeId(idHash=${idHash}, reasonCode=${reasonCode})`);

  const tx = await contract.revokeId(idHash, reasonCode);
  console.error(`[revoke] Transaction submitted: ${tx.hash}`);

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
      if (parsed && parsed.name === "IdRevoked") {
        emitted = {
          idHash: parsed.args.idHash,
          reasonCode: parsed.args.reasonCode,
          revoker: parsed.args.revoker,
          revokedAt: parsed.args.revokedAt.toString(),
        };
        break;
      }
    } catch {
      continue;
    }
  }

  printResult({
    ok: true,
    txHash: tx.hash,
    status: "CONFIRMED",
    blockNumber: receipt.blockNumber,
    event: emitted,
  });
}

main().catch((error) => {
  printResult({ ok: false, error: error?.message ?? String(error) });
  process.exit(1);
});