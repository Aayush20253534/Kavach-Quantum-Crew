import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Shared Hardhat fixture used by every test file in this folder.
 * Deploys a fresh TrustAnchor contract and returns the deployer
 * (auto-authorized issuer / admin) plus a handful of extra signers
 * for access-control negative tests.
 *
 * Use with Hardhat Network Helpers' `loadFixture` so each `it()`
 * block gets an isolated contract state without repaying deployment
 * gas on every test (loadFixture snapshots/reverts internally).
 */
export async function deployTrustAnchorFixture() {
  const [deployer, issuer2, stranger, otherAdmin] = await ethers.getSigners();

  const TrustAnchor = await ethers.getContractFactory("TrustAnchor");
  const trustAnchor = await TrustAnchor.deploy();
  await trustAnchor.waitForDeployment();

  return { trustAnchor, deployer, issuer2, stranger, otherAdmin };
}

export type FixtureResult = Awaited<ReturnType<typeof deployTrustAnchorFixture>>;

/**
 * Small time helpers re-exported in one place so test files don't each
 * import Hardhat Network Helpers separately.
 */
export const ONE_HOUR = 60 * 60;
export const ONE_DAY = 24 * ONE_HOUR;
export const ONE_WEEK = 7 * ONE_DAY;

/**
 * Convenience: current chain block timestamp (not wall-clock time),
 * since Hardhat's internal clock can be moved forward independently
 * of the host machine's clock via time.increase().
 */
export async function currentBlockTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  if (!block) throw new Error("Could not fetch latest block");
  return block.timestamp;
}

/**
 * Deterministic bytes32 test hashes — plain keccak256 of a label string,
 * so every test file can generate readable, collision-free fake hashes
 * without pulling in the real adapter/hasher.ts (idempotency.test.ts is
 * the one file that DOES import the real hasher, deliberately).
 */
export function fakeHash(label: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(label));
}
