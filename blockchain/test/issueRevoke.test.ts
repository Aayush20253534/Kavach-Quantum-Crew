import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployTrustAnchorFixture,
  currentBlockTimestamp,
  fakeHash,
  ONE_WEEK,
} from "./fixtures";

// IdStatus enum indices — must match `enum IdStatus { ACTIVE, REVOKED, EXPIRED }` in TrustAnchor.sol
const IdStatus = { ACTIVE: 0, REVOKED: 1, EXPIRED: 2 } as const;

const CONTRACT_VERSION = 1;

describe("TrustAnchor — Digital ID: issue / verify / revoke", () => {
  describe("issueId", () => {
    it("succeeds from an authorized issuer and emits IdIssued with exact args", async () => {
      const { trustAnchor, deployer } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-1");
      const tripHash = fakeHash("trip-1");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await expect(
        trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION)
      )
        .to.emit(trustAnchor, "IdIssued")
        .withArgs(idHash, tripHash, deployer.address, issuedAt, expiresAt, CONTRACT_VERSION);
    });

    it("reverts with NOT_AUTHORIZED_ISSUER when called by a non-authorized address", async () => {
      const { trustAnchor, stranger } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-2");
      const tripHash = fakeHash("trip-2");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await expect(
        trustAnchor
          .connect(stranger)
          .issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");
    });

    it("reverts with INVALID_WINDOW when expiresAt <= issuedAt", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-3");
      const tripHash = fakeHash("trip-3");
      const issuedAt = await currentBlockTimestamp();

      // Equal timestamps
      await expect(
        trustAnchor.issueId(idHash, tripHash, issuedAt, issuedAt, CONTRACT_VERSION)
      ).to.be.revertedWith("INVALID_WINDOW");

      // expiresAt strictly before issuedAt
      await expect(
        trustAnchor.issueId(idHash, tripHash, issuedAt, issuedAt - 1, CONTRACT_VERSION)
      ).to.be.revertedWith("INVALID_WINDOW");
    });

    it("reverts with ID_ALREADY_ISSUED when the same idHash is issued twice", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-4");
      const tripHash = fakeHash("trip-4");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION);

      await expect(
        trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION)
      ).to.be.revertedWith("ID_ALREADY_ISSUED");
    });

    it("allows re-issuance under a NEW idHash after a revoke (history-preserving, not an overwrite)", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const oldIdHash = fakeHash("tourist-id-5-v1");
      const newIdHash = fakeHash("tourist-id-5-v2");
      const tripHash = fakeHash("trip-5");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await trustAnchor.issueId(oldIdHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION);
      await trustAnchor.revokeId(oldIdHash, 1);

      // New hash for the "re-issued" ID must succeed independently
      await expect(
        trustAnchor.issueId(newIdHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION)
      ).to.emit(trustAnchor, "IdIssued");

      const oldResult = await trustAnchor.verifyId(oldIdHash);
      const newResult = await trustAnchor.verifyId(newIdHash);
      expect(oldResult[0]).to.equal(IdStatus.REVOKED);
      expect(newResult[0]).to.equal(IdStatus.ACTIVE);
    });
  });

  describe("verifyId", () => {
    it("returns the zero-address / default tuple for an unissued hash", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const unissuedHash = fakeHash("never-issued");
      const [status, issuer, issuedAt, expiresAt] = await trustAnchor.verifyId(unissuedHash);

      expect(issuer).to.equal(ethers.ZeroAddress);
      expect(issuedAt).to.equal(0n);
      expect(expiresAt).to.equal(0n);
      // status defaults to enum index 0 (ACTIVE) at the storage level for an
      // empty struct — callers (backend) must treat issuer === address(0) as
      // the actual "not found" signal, not the status field alone.
      expect(status).to.equal(IdStatus.ACTIVE);
    });

    it("returns ACTIVE with the correct issuer and window for a freshly issued ID", async () => {
      const { trustAnchor, deployer } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-6");
      const tripHash = fakeHash("trip-6");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION);

      const [status, issuer, returnedIssuedAt, returnedExpiresAt, version] =
        await trustAnchor.verifyId(idHash);

      expect(status).to.equal(IdStatus.ACTIVE);
      expect(issuer).to.equal(deployer.address);
      expect(returnedIssuedAt).to.equal(BigInt(issuedAt));
      expect(returnedExpiresAt).to.equal(BigInt(expiresAt));
      expect(version).to.equal(CONTRACT_VERSION);
    });

    it("returns EXPIRED after time travel past expiresAt, even without an explicit revoke", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-7");
      const tripHash = fakeHash("trip-7");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_HOUR_LOCAL;

      await trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION);

      // Move the chain clock past expiry
      await time.increase(ONE_HOUR_LOCAL + 60);

      const [status] = await trustAnchor.verifyId(idHash);
      expect(status).to.equal(IdStatus.EXPIRED);
    });
  });

  describe("revokeId", () => {
    it("succeeds on an active ID, emits IdRevoked with the given reasonCode, and flips status to REVOKED", async () => {
      const { trustAnchor, deployer } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-8");
      const tripHash = fakeHash("trip-8");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;
      const reasonCode = 3;

      await trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION);

      const tx = await trustAnchor.revokeId(idHash, reasonCode);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const revokedAt = BigInt(block!.timestamp);

      await expect(tx)
        .to.emit(trustAnchor, "IdRevoked")
        .withArgs(idHash, reasonCode, deployer.address, revokedAt);

      const [status] = await trustAnchor.verifyId(idHash);
      expect(status).to.equal(IdStatus.REVOKED);
    });

    it("reverts with ID_NOT_ACTIVE on a double-revoke", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-9");
      const tripHash = fakeHash("trip-9");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION);
      await trustAnchor.revokeId(idHash, 1);

      await expect(trustAnchor.revokeId(idHash, 1)).to.be.revertedWith("ID_NOT_ACTIVE");
    });

    it("reverts with ID_NOT_FOUND when revoking a non-existent idHash", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const neverIssued = fakeHash("does-not-exist");
      await expect(trustAnchor.revokeId(neverIssued, 1)).to.be.revertedWith("ID_NOT_FOUND");
    });

    it("reverts with NOT_AUTHORIZED_ISSUER when called by a non-authorized address", async () => {
      const { trustAnchor, stranger } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-10");
      const tripHash = fakeHash("trip-10");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION);

      await expect(
        trustAnchor.connect(stranger).revokeId(idHash, 1)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");
    });

    it("never anchors the free-text reason — only reasonCode (uint8) appears in the event/ABI", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const idHash = fakeHash("tourist-id-11");
      const tripHash = fakeHash("trip-11");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION);
      const receipt = await (await trustAnchor.revokeId(idHash, 7)).wait();

      const event = receipt!.logs
        .map((log) => {
          try {
            return trustAnchor.interface.parseLog(log as any);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "IdRevoked");

      expect(event).to.not.be.undefined;
      // Structural guarantee: reasonCode must be a small numeric type, never a string.
      const reasonCodeFragment = trustAnchor.interface.getEvent("IdRevoked")!.inputs.find(
        (i) => i.name === "reasonCode"
      );
      expect(reasonCodeFragment?.type).to.match(/^uint8$/);
    });
  });
});

// Local alias kept separate from the shared ONE_HOUR export to avoid an
// accidental name collision if this file is later merged with others.
const ONE_HOUR_LOCAL = 60 * 60;

// Trip extensions must preserve the same credential hash while moving expiry forward.
describe("TrustAnchor trip credential extension", () => {
  it("extends an active ID and reports the new expiry", async () => {
    const [issuer] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TrustAnchor", issuer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const idHash = ethers.keccak256(ethers.toUtf8Bytes("extendable-id"));
    const tripHash = ethers.keccak256(ethers.toUtf8Bytes("extendable-trip"));
    const block = await ethers.provider.getBlock("latest");
    const issuedAt = Number(block!.timestamp);
    const initialExpiry = issuedAt + 3600;
    const extendedExpiry = issuedAt + 7200;
    await contract.issueId(idHash, tripHash, issuedAt, initialExpiry, 1);
    await expect(contract.extendId(idHash, extendedExpiry)).to.emit(contract, "IdExtended");
    const verification = await contract.verifyId(idHash);
    expect(Number(verification.expiresAt)).to.equal(extendedExpiry);
  });
});
