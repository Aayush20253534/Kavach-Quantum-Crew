/**
 * blockchain/scripts/deploy.ts
 *
 * Deploys TrustAnchor.sol to whichever network Hardhat is pointed at
 * (local Hardhat node by default; testnet is optional/secondary — see
 * Invariant 7 in the blueprint) and writes deployment metadata to disk
 * so the adapter/backend can pick up the contract address + ABI path.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network hardhat
 *   npx hardhat run scripts/deploy.ts --network localhost
 *   npx hardhat run scripts/deploy.ts --network testnet   (optional/secondary)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { ethers, network } from "hardhat";

interface DeploymentRecord {
  network: string;
  chainId: number;
  contractAddress: string;
  deployerAddress: string;
  deployedAtBlock: number;
  deployedAtTimestamp: string;
  contractVersion: string;
  abiPath: string;
}

const CONTRACT_VERSION = process.env.CONTRACT_VERSION ?? "trust-anchor-v1";

async function main(): Promise<void> {
  console.log(`\n[deploy] Target network: ${network.name}`);

  // 1 & 2. Compile happens automatically under `hardhat run`; get deployer.
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "[deploy] No signer available. Check ISSUER_PRIVATE_KEY / network config."
    );
  }
  console.log(`[deploy] Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`[deploy] Deployer balance: ${ethers.formatEther(balance)} ETH`);

  // 3. Deploy TrustAnchor with no constructor arguments.
  const TrustAnchorFactory = await ethers.getContractFactory("TrustAnchor");
  const trustAnchor = await TrustAnchorFactory.deploy();

  // 4. Wait for the deployment transaction to be mined.
  await trustAnchor.waitForDeployment();
  const contractAddress = await trustAnchor.getAddress();
  const deployTx = trustAnchor.deploymentTransaction();

  if (!deployTx) {
    throw new Error("[deploy] Deployment transaction not found after deploy.");
  }
  const receipt = await deployTx.wait();
  if (!receipt) {
    throw new Error("[deploy] Deployment receipt not found — chain may be unreachable.");
  }

  console.log(`[deploy] TrustAnchor deployed at: ${contractAddress}`);
  console.log(`[deploy] Deployed in block: ${receipt.blockNumber}`);

  // 5. Sanity check: admin must equal deployer.
  const onChainAdmin: string = await trustAnchor.admin();
  if (onChainAdmin.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(
      `[deploy] FATAL: on-chain admin (${onChainAdmin}) does not match deployer ` +
        `(${deployer.address}). Aborting — this would indicate a corrupted deployment.`
    );
  }
  console.log(`[deploy] Sanity check passed: admin === deployer`);

  // Resolve chain id
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  // 6. Write deployment metadata to blockchain/deployments/<network>.json
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const abiPath = "./artifacts/contracts/TrustAnchor.sol/TrustAnchor.json";

  const record: DeploymentRecord = {
    network: network.name,
    chainId,
    contractAddress,
    deployerAddress: deployer.address,
    deployedAtBlock: receipt.blockNumber,
    deployedAtTimestamp: new Date().toISOString(),
    contractVersion: CONTRACT_VERSION,
    abiPath,
  };

  const outPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n", "utf-8");
  console.log(`[deploy] Wrote deployment metadata to: ${outPath}`);

  // 7. Print copy-pasteable values for the blockchain gateway .env.
  // The Express server talks to the gateway and never receives the issuer key.
  console.log("\n[deploy] Add these to blockchain/.env:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`CHAIN_ID=${chainId}`);
  console.log(`CONTRACT_VERSION=${CONTRACT_VERSION}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[deploy] FAILED:", error?.message ?? error);
    process.exit(1);
  });