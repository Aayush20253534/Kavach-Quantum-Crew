/**
 * blockchain/scripts/verify.ts
 *
 * Standalone CLI script: calls the read-only verifyId(idHash) view
 * function (no gas, no wait) and prints status/issuer/window in the
 * exact JSON shape used by the backend/UI (matches source blueprint
 * §6 / §13 example response).
 *
 * Usage:
 *   npx ts-node scripts/verify.ts --idHash 0xabc... [--network hardhat]
 */

import { parseArgs, requireArg, loadDeployment, connectContract, printResult } from "./_shared";

const STATUS_NAMES = ["ACTIVE", "REVOKED", "EXPIRED"] as const;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const idHash = requireArg(args, "idHash");
  const networkName = args["network"];

  const deployment = loadDeployment(networkName);
  const { contract } = connectContract(deployment);

  const [statusRaw, issuer, issuedAt, expiresAt, version] = await contract.verifyId(idHash);

  const statusIndex = Number(statusRaw);
  const notFound = issuer.toLowerCase() === ZERO_ADDRESS;

  if (notFound) {
    printResult({
      idHash,
      status: "NOT_FOUND",
      issuer: null,
      issuedAt: null,
      expiresAt: null,
      version: null,
      chain: deployment.network,
      contractVersion: deployment.contractVersion,
    });
    return;
  }

  printResult({
    idHash,
    status: STATUS_NAMES[statusIndex] ?? "UNKNOWN",
    issuer,
    issuedAt: new Date(Number(issuedAt) * 1000).toISOString(),
    expiresAt: new Date(Number(expiresAt) * 1000).toISOString(),
    version: Number(version),
    chain: deployment.network,
    contractVersion: deployment.contractVersion,
  });
}

main().catch((error) => {
  printResult({ ok: false, error: error?.message ?? String(error) });
  process.exit(1);
});