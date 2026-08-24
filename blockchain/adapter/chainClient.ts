/**
 * blockchain/adapter/chainClient.ts
 *
 * The only module in the adapter package that actually talks to the
 * chain. Everything else goes through this module — no other file in
 * `adapter/` imports `ethers` directly.
 *
 * Reads deployment metadata from `deployments/<network>.json` (written
 * by scripts/deploy.ts) to locate the contract address and ABI.
 */

import * as fs from "fs";
import * as path from "path";
import { ethers } from "ethers";
import {
  ChainSubmissionError,
  ChainTimeoutError,
  type VerificationResult,
  type EvidenceVerificationResult,
  type IncidentVerificationResult,
  type ConsentVerificationResult,
} from "./types";

interface DeploymentMetadata {
  network: string;
  chainId: number;
  contractAddress: string;
  deployerAddress: string;
  deployedAtBlock: number;
  deployedAtTimestamp: string;
  contractVersion: string;
  abiPath: string;
}

interface ReceiptResult {
  status: "CONFIRMED" | "FAILED";
  blockNumber: number | null;
  gasUsed: string | null;
}

/** Which network's deployment file to load. Defaults to "hardhat-local"
 * but can be overridden via DEPLOY_NETWORK for testnet/localhost runs. */
function resolveNetworkName(): string {
  return process.env.DEPLOY_NETWORK || "hardhat-local";
}

function loadDeployment(): DeploymentMetadata {
  const network = resolveNetworkName();
  const deploymentPath = path.resolve(
    __dirname,
    "..",
    "deployments",
    `${network}.json`
  );

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      `chainClient: no deployment found for network "${network}" at ${deploymentPath}. Run scripts/deploy.ts first.`
    );
  }

  const raw = fs.readFileSync(deploymentPath, "utf-8");
  return JSON.parse(raw) as DeploymentMetadata;
}

function loadAbi(abiPath: string): ethers.InterfaceAbi {
  const resolvedPath = path.isAbsolute(abiPath)
    ? abiPath
    : path.resolve(__dirname, "..", abiPath);
  const artifact = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  return artifact.abi;
}

export class ChainClient {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;
  private readonly contract: ethers.Contract;
  public readonly contractAddress: string;
  public readonly contractVersion: string;
  public readonly chainName: string;

  constructor() {
    const rpcUrl = process.env.CHAIN_RPC_URL;
    const privateKey = process.env.ISSUER_PRIVATE_KEY;
    const contractAddressOverride = process.env.CONTRACT_ADDRESS;
    const contractVersionOverride = process.env.CONTRACT_VERSION;

    if (!rpcUrl) throw new Error("chainClient: CHAIN_RPC_URL is not set");
    if (!privateKey)
      throw new Error("chainClient: ISSUER_PRIVATE_KEY is not set");

    const deployment = loadDeployment();
    const abi = loadAbi(deployment.abiPath);

    this.contractAddress = contractAddressOverride || deployment.contractAddress;
    this.contractVersion = contractVersionOverride || deployment.contractVersion;
    this.chainName = deployment.network;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(this.contractAddress, abi, this.wallet);
  }

  // -----------------------------------------------------------------
  // State-changing calls — each submits and returns the tx hash
  // immediately WITHOUT awaiting confirmation (Invariant 4). The
  // caller / job queue handles the async wait.
  // -----------------------------------------------------------------

  async issueId(
    idHash: string,
    tripHash: string,
    issuedAt: number,
    expiresAt: number,
    version: number
  ): Promise<string> {
    try {
      const tx = await this.contract.issueId(
        idHash,
        tripHash,
        issuedAt,
        expiresAt,
        version
      );
      return tx.hash as string;
    } catch (err) {
      throw new ChainSubmissionError(
        `issueId submission failed for idHash=${idHash}: ${(err as Error).message}`,
        err
      );
    }
  }

  async revokeId(idHash: string, reasonCode: number): Promise<string> {
    try {
      const tx = await this.contract.revokeId(idHash, reasonCode);
      return tx.hash as string;
    } catch (err) {
      throw new ChainSubmissionError(
        `revokeId submission failed for idHash=${idHash}: ${(err as Error).message}`,
        err
      );
    }
  }

  async anchorEvidence(evidenceHash: string, version: number): Promise<string> {
    try {
      const tx = await this.contract.anchorEvidence(evidenceHash, version);
      return tx.hash as string;
    } catch (err) {
      throw new ChainSubmissionError(
        `anchorEvidence submission failed for evidenceHash=${evidenceHash}: ${(err as Error).message}`,
        err
      );
    }
  }

  async anchorIncident(incidentHash: string, version: number): Promise<string> {
    try {
      const tx = await this.contract.anchorIncident(incidentHash, version);
      return tx.hash as string;
    } catch (err) {
      throw new ChainSubmissionError(
        `anchorIncident submission failed for incidentHash=${incidentHash}: ${(err as Error).message}`,
        err
      );
    }
  }

  async anchorConsent(consentHash: string, version: number): Promise<string> {
    try {
      const tx = await this.contract.anchorConsent(consentHash, version);
      return tx.hash as string;
    } catch (err) {
      throw new ChainSubmissionError(
        `anchorConsent submission failed for consentHash=${consentHash}: ${(err as Error).message}`,
        err
      );
    }
  }

  // -----------------------------------------------------------------
  // Receipt polling
  // -----------------------------------------------------------------

  /**
   * Polls for a transaction receipt. A reverted transaction
   * (receipt.status === 0) maps to "FAILED", not a thrown error —
   * failure is a normal, expected outcome the job queue must handle
   * gracefully. A timeout throws ChainTimeoutError so the caller can
   * leave the job PENDING and retry on the next poll (chain-outage
   * resilience).
   */
  async waitForReceipt(
    txHash: string,
    timeoutMs = 30000
  ): Promise<ReceiptResult> {
    try {
      const receipt = await this.provider.waitForTransaction(
        txHash,
        1,
        timeoutMs
      );

      if (!receipt) {
        throw new ChainTimeoutError(
          `waitForReceipt: no receipt for ${txHash} within ${timeoutMs}ms`,
          txHash
        );
      }

      return {
        status: receipt.status === 1 ? "CONFIRMED" : "FAILED",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString() ?? null,
      };
    } catch (err) {
      if (err instanceof ChainTimeoutError) throw err;

      // ethers' waitForTransaction throws its own timeout error shape;
      // normalize anything that looks like a timeout into ChainTimeoutError
      // so the job queue's retry branch catches it correctly.
      const message = (err as Error).message || "";
      if (/timeout/i.test(message)) {
        throw new ChainTimeoutError(
          `waitForReceipt: timed out waiting for ${txHash}: ${message}`,
          txHash
        );
      }

      throw new ChainSubmissionError(
        `waitForReceipt: unexpected error for ${txHash}: ${message}`,
        err
      );
    }
  }

  // -----------------------------------------------------------------
  // Read-only verification calls
  // -----------------------------------------------------------------

  async verifyId(idHash: string): Promise<VerificationResult> {
    const [status, issuer, issuedAt, expiresAt, version] =
      await this.contract.verifyId(idHash);

    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const issuedAtNum = Number(issuedAt);
    const expiresAtNum = Number(expiresAt);

    if (issuer === zeroAddress) {
      return {
        idHash,
        status: "NOT_FOUND",
        issuer: zeroAddress,
        issuedAt: new Date(0).toISOString(),
        expiresAt: new Date(0).toISOString(),
        chain: this.chainName,
        contractVersion: `trust-anchor-v${version}`,
      };
    }

    // Contract enum: 0=ACTIVE, 1=REVOKED, 2=EXPIRED. The contract itself
    // already applies lazy-expiry in its view function, but we re-check
    // here defensively in case of clock skew between node and caller.
    const statusMap: Record<number, VerificationResult["status"]> = {
      0: "ACTIVE",
      1: "REVOKED",
      2: "EXPIRED",
    };
    let resolvedStatus = statusMap[Number(status)] ?? "NOT_FOUND";

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (resolvedStatus === "ACTIVE" && nowSeconds > expiresAtNum) {
      resolvedStatus = "EXPIRED";
    }

    return {
      idHash,
      status: resolvedStatus,
      issuer,
      issuedAt: new Date(issuedAtNum * 1000).toISOString(),
      expiresAt: new Date(expiresAtNum * 1000).toISOString(),
      chain: this.chainName,
      contractVersion: `trust-anchor-v${version}`,
    };
  }

  async verifyEvidence(evidenceHash: string): Promise<EvidenceVerificationResult> {
    const [exists, anchoredAt] = await this.contract.verifyEvidence(evidenceHash);
    return { exists, anchoredAt: Number(anchoredAt) };
  }

  async verifyIncident(incidentHash: string): Promise<IncidentVerificationResult> {
    const [exists, anchoredAt] = await this.contract.verifyIncident(incidentHash);
    return { exists, anchoredAt: Number(anchoredAt) };
  }

  async verifyConsent(consentHash: string): Promise<ConsentVerificationResult> {
    const exists = await this.contract.verifyConsent(consentHash);
    return { exists };
  }

  // -----------------------------------------------------------------
  // Event queries — used by privacyScan.ts
  // -----------------------------------------------------------------

  /** Exposes the underlying ethers Contract for read-only event queries
   * (privacyScan.ts needs queryFilter + the ABI's fragment types). */
  getRawContract(): ethers.Contract {
    return this.contract;
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}
