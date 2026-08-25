/**
 * blockchain/scripts/issue.ts
 *
 * Standalone CLI script: issues a digital tourist ID verification proof
 * on-chain. Computes issuedAt = now, expiresAt = now + expiresInHours,
 * calls issueId(), waits for 1 confirmation, and prints the emitted
 * IdIssued event fields as structured JSON.
 *
 * This script does NOT hash anything itself — the caller must already
 * have a canonically-hashed idHash / tripHash (see adapter/hasher.ts).
 * It only submits the anchor transaction for hashes you already have.
 *
 * Usage:
 *   npx ts-node scripts/issue.ts \
 *     --idHash 0xabc... \
 *     --tripHash 0xdef... \
 *     --expiresInHours 168 \
 *     [--version 1] \
 *     [--network hardhat]
 */

import {
  parseArgs,
  requireArg,
  optionalArg,
  loadDeployment,
  connectContract,
  nowSeconds,
  printResult,
} from "./_shared";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const idHash = requireArg(args, "idHash");
  const tripHash = requireArg(args, "tripHash");
  const expiresInHours = Number(requireArg(args, "expiresInHours"));
  const version = Number(optionalArg(args, "version", "1"));
  const networkName = args["network"];

  if (!Number.isFinite(expiresInHours) || expiresInHours <= 0) {
    throw new Error("--expiresInHours must be a positive number.");
  }

  const issuedAt = nowSeconds();
  const expiresAt = issuedAt + Math.floor(expiresInHours * 3600);

  const deployment = loadDeployment(networkName);
  const { contract } = connectContract(deployment);

  console.error(
    `[issue] Submitting issueId(idHash=${idHash}, tripHash=${tripHash}, ` +
      `issuedAt=${issuedAt}, expiresAt=${expiresAt}, version=${version})`
  );

  const tx = await contract.issueId(idHash, tripHash, issuedAt, expiresAt, version);
  console.error(`[issue] Transaction submitted: ${tx.hash}`);

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

  // Pull the emitted IdIssued event fields back out of the receipt.
  const iface = contract.interface;
  let emitted: Record<string, unknown> | null = null;

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "IdIssued") {
        emitted = {
          idHash: parsed.args.idHash,
          tripHash: parsed.args.tripHash,
          issuer: parsed.args.issuer,
          issuedAt: parsed.args.issuedAt.toString(),
          expiresAt: parsed.args.expiresAt.toString(),
          version: parsed.args.version,
        };
        break;
      }
    } catch {
      // Not a log this contract's ABI recognizes — skip.
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