/**
 * blockchain/scripts/_shared.ts
 *
 * Small shared helper used ONLY by the standalone CLI scripts in this
 * folder (issue.ts, revoke.ts, verify.ts, anchorEvidence.ts,
 * anchorIncident.ts, seedDemo.ts) so each script can:
 *   - load deployments/<network>.json
 *   - connect via ethers.js using CHAIN_RPC_URL + ISSUER_PRIVATE_KEY
 *   - parse simple --flag value CLI args
 *
 * This is intentionally NOT part of adapter/ — the blueprint (§4) notes
 * these scripts and adapter/chainClient.ts *may* share helpers, but the
 * scripts must remain standalone/demo-runnable on their own. Keeping this
 * file separate avoids a hard dependency on the backend's job-queue/Prisma
 * wiring just to run a one-off CLI command.
 */

import * as fs from "fs";
import * as path from "path";
import { ethers } from "ethers";

export interface DeploymentRecord {
  network: string;
  chainId: number;
  contractAddress: string;
  deployerAddress: string;
  deployedAtBlock: number;
  deployedAtTimestamp: string;
  contractVersion: string;
  abiPath: string;
}

/** Parses `--flagName value` pairs from process.argv into a plain object. */
export function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  return args;
}

export function requireArg(args: Record<string, string>, name: string): string {
  const value = args[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required --${name} argument.`);
  }
  return value;
}

export function optionalArg(
  args: Record<string, string>,
  name: string,
  fallback: string
): string {
  return args[name] !== undefined ? args[name] : fallback;
}

/** Resolves the network name the same way Hardhat CLI scripts do (defaults to "hardhat"). */
export function resolveNetworkName(): string {
  return process.env.HARDHAT_NETWORK ?? "hardhat";
}

/** Loads blockchain/deployments/<network>.json */
export function loadDeployment(networkName?: string): DeploymentRecord {
  const name = networkName ?? resolveNetworkName();
  const deploymentPath = path.join(__dirname, "..", "deployments", `${name}.json`);

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      `No deployment found for network "${name}" at ${deploymentPath}. ` +
        `Run "npx hardhat run scripts/deploy.ts --network ${name}" first.`
    );
  }

  const raw = fs.readFileSync(deploymentPath, "utf-8");
  return JSON.parse(raw) as DeploymentRecord;
}

/** Loads the compiled ABI referenced by a deployment record. */
export function loadAbi(record: DeploymentRecord): any {
  const abiFullPath = path.join(__dirname, "..", record.abiPath);
  if (!fs.existsSync(abiFullPath)) {
    throw new Error(
      `ABI artifact not found at ${abiFullPath}. Run "npx hardhat compile" first.`
    );
  }
  const artifact = JSON.parse(fs.readFileSync(abiFullPath, "utf-8"));
  return artifact.abi;
}

/**
 * Connects to the chain using CHAIN_RPC_URL + ISSUER_PRIVATE_KEY from the
 * environment, and returns a typed-ish contract instance wired to a Wallet
 * (so state-changing calls are signed by the backend-controlled issuer key,
 * per Invariant 6 — tourists never touch a wallet).
 */
export function connectContract(record: DeploymentRecord): {
  provider: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
  contract: ethers.Contract;
} {
  const rpcUrl = process.env.CHAIN_RPC_URL;
  const privateKey = process.env.ISSUER_PRIVATE_KEY || process.env.privateKey;

  if (!rpcUrl) {
    throw new Error("CHAIN_RPC_URL is not set in the environment.");
  }
  if (!privateKey) {
    throw new Error("ISSUER_PRIVATE_KEY (or legacy privateKey) is not set in the environment.");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const abi = loadAbi(record);
  const contract = new ethers.Contract(record.contractAddress, abi, wallet);

  return { provider, wallet, contract };
}

/** Current unix time in whole seconds (contract fields are uint64 seconds, not ms). */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Pretty JSON print to stdout — used by every CLI script for structured, pipeable output. */
export function printResult(result: Record<string, unknown>): void {
  console.log(JSON.stringify(result, null, 2));
}