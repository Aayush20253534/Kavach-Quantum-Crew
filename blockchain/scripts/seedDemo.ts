/**
 * blockchain/scripts/seedDemo.ts
 *
 * One-command deterministic setup for the judge demo: assumes the
 * contract has already been deployed (run scripts/deploy.ts first if
 * not), issues one fictional tourist ID from FIXED seed data, leaves it
 * ACTIVE, and prints every value needed to drive the 5-minute demo
 * runbook — so the demo never depends on live typing.
 *
 * Because this script imports adapter/hasher.ts directly (same language,
 * same repo), there is exactly ONE hashing implementation used by both
 * the demo seed and the real backend — eliminating any risk of the demo
 * script and the backend computing different digests for the same
 * logical data.
 *
 * Usage:
 *   npx ts-node scripts/seedDemo.ts [--network hardhat]
 */

import "dotenv/config";

import { hashIdPayload } from "../adapter/hasher";
import { parseArgs, loadDeployment, connectContract, nowSeconds, printResult } from "./_shared";

// Fixed, reproducible demo seed data — deliberately fictional.
const DEMO_SEED = {
  touristIdSeq: 1001,
  tripId: "trip-demo-0001",
  salt: "sih25002-demo-fixed-salt-do-not-use-in-prod",
  contractVersion: 1,
  expiresInHours: 168, // 7 days
};

const CONTRACT_VERSION_TAG = process.env.CONTRACT_VERSION ?? "trust-anchor-v1";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const networkName = args["network"];

  const deployment = loadDeployment(networkName);
  const { contract } = connectContract(deployment);

  // Deterministically derive idHash from fixed demo seed data.
  const idHash = hashIdPayload(
    DEMO_SEED.touristIdSeq,
    DEMO_SEED.tripId,
    CONTRACT_VERSION_TAG,
    DEMO_SEED.salt
  );

  // tripHash is derived the same way, scoped to just the trip payload,
  // salted with a distinct (but still fixed/deterministic) salt so the
  // two hashes are not trivially related to one another.
  const tripHash = hashIdPayload(
    DEMO_SEED.touristIdSeq,
    DEMO_SEED.tripId + "::trip-scope",
    CONTRACT_VERSION_TAG,
    DEMO_SEED.salt + "-trip"
  );

  // Check whether this demo identity was already issued in a prior run
  // (idempotent re-run support) before attempting to issue again.
  const [existingStatusRaw, existingIssuer] = await contract.verifyId(idHash);
  const alreadyIssued =
    existingIssuer && existingIssuer.toLowerCase() !== "0x0000000000000000000000000000000000000000";

  let issuedAt: number;
  let expiresAt: number;
  let txHash: string | null = null;

  if (alreadyIssued) {
    console.error(
      `[seedDemo] Demo identity already issued on-chain (idHash=${idHash}); skipping issueId().`
    );
    const [, , issuedAtRaw, expiresAtRaw] = await contract.verifyId(idHash);
    issuedAt = Number(issuedAtRaw);
    expiresAt = Number(expiresAtRaw);
  } else {
    issuedAt = nowSeconds();
    expiresAt = issuedAt + DEMO_SEED.expiresInHours * 3600;

    console.error(
      `[seedDemo] Issuing demo identity: idHash=${idHash}, tripHash=${tripHash}`
    );

    const tx = await contract.issueId(
      idHash,
      tripHash,
      issuedAt,
      expiresAt,
      DEMO_SEED.contractVersion
    );
    txHash = tx.hash;
    const receipt = await tx.wait(1);

    if (!receipt || receipt.status !== 1) {
      printResult({
        ok: false,
        error: "seedDemo: issueId transaction failed or reverted.",
        txHash,
      });
      process.exit(1);
    }

    console.error(`[seedDemo] Issued in block ${receipt.blockNumber} (tx: ${txHash})`);
  }

  const verifyUrl = `.../digital-ids/${idHash}/verify`;
  const qrPayload = { idHash, verifyUrl };

  // Demo cheat-sheet block — deterministic, reproducible on-chain state
  // the whole team can rely on for rehearsal.
  console.log("\nDEMO IDENTITY");
  console.log(`idHash:      ${idHash}`);
  console.log(`tripHash:    ${tripHash}`);
  console.log(`status:      ACTIVE`);
  console.log(`issuedAt:    ${new Date(issuedAt * 1000).toISOString()}`);
  console.log(`expiresAt:   ${new Date(expiresAt * 1000).toISOString()}`);
  console.log(`QR payload:  ${JSON.stringify(qrPayload)}`);
  if (txHash) {
    console.log(`txHash:      ${txHash}`);
  }
  console.log("");

  printResult({
    ok: true,
    idHash,
    tripHash,
    status: "ACTIVE",
    issuedAt: new Date(issuedAt * 1000).toISOString(),
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    qrPayload,
    txHash,
    alreadyIssued,
    network: deployment.network,
    contractAddress: deployment.contractAddress,
  });
}

main().catch((error) => {
  printResult({ ok: false, error: error?.message ?? String(error) });
  process.exit(1);
});