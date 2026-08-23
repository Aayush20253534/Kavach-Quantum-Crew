import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployTrustAnchorFixture, currentBlockTimestamp, fakeHash, ONE_WEEK } from "./fixtures";

const CONTRACT_VERSION = 1;

describe("TrustAnchor — Access control (admin / authorized issuers)", () => {
  it("auto-authorizes the deployer as both admin and issuer at construction", async () => {
    const { trustAnchor, deployer } = await loadFixture(deployTrustAnchorFixture);

    expect(await trustAnchor.admin()).to.equal(deployer.address);
    expect(await trustAnchor.authorizedIssuers(deployer.address)).to.equal(true);
  });

  describe("authorizeIssuer", () => {
    it("is only callable by admin — reverts with NOT_ADMIN otherwise", async () => {
      const { trustAnchor, issuer2, stranger } = await loadFixture(deployTrustAnchorFixture);

      await expect(
        trustAnchor.connect(stranger).authorizeIssuer(issuer2.address)
      ).to.be.revertedWith("NOT_ADMIN");
    });

    it("succeeds when called by admin and emits IssuerAuthorized", async () => {
      const { trustAnchor, issuer2 } = await loadFixture(deployTrustAnchorFixture);

      await expect(trustAnchor.authorizeIssuer(issuer2.address))
        .to.emit(trustAnchor, "IssuerAuthorized")
        .withArgs(issuer2.address);

      expect(await trustAnchor.authorizedIssuers(issuer2.address)).to.equal(true);
    });

    it("a newly authorized issuer can immediately call issueId", async () => {
      const { trustAnchor, issuer2 } = await loadFixture(deployTrustAnchorFixture);

      await trustAnchor.authorizeIssuer(issuer2.address);

      const idHash = fakeHash("issuer2-issued-id-1");
      const tripHash = fakeHash("issuer2-trip-1");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await expect(
        trustAnchor
          .connect(issuer2)
          .issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION)
      ).to.emit(trustAnchor, "IdIssued");
    });
  });

  describe("revokeIssuer", () => {
    it("is only callable by admin — reverts with NOT_ADMIN otherwise", async () => {
      const { trustAnchor, deployer, stranger } = await loadFixture(deployTrustAnchorFixture);

      await expect(
        trustAnchor.connect(stranger).revokeIssuer(deployer.address)
      ).to.be.revertedWith("NOT_ADMIN");
    });

    it("succeeds when called by admin and emits IssuerRevoked", async () => {
      const { trustAnchor, issuer2 } = await loadFixture(deployTrustAnchorFixture);

      await trustAnchor.authorizeIssuer(issuer2.address);

      await expect(trustAnchor.revokeIssuer(issuer2.address))
        .to.emit(trustAnchor, "IssuerRevoked")
        .withArgs(issuer2.address);

      expect(await trustAnchor.authorizedIssuers(issuer2.address)).to.equal(false);
    });

    it("a revoked issuer can no longer call ANY state-changing function — reverts NOT_AUTHORIZED_ISSUER", async () => {
      const { trustAnchor, issuer2 } = await loadFixture(deployTrustAnchorFixture);

      await trustAnchor.authorizeIssuer(issuer2.address);
      await trustAnchor.revokeIssuer(issuer2.address);

      const idHash = fakeHash("revoked-issuer-attempt-1");
      const tripHash = fakeHash("revoked-issuer-trip-1");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;
      const evidenceHash = fakeHash("revoked-issuer-evidence-1");
      const incidentHash = fakeHash("revoked-issuer-incident-1");
      const consentHash = fakeHash("revoked-issuer-consent-1");

      await expect(
        trustAnchor
          .connect(issuer2)
          .issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");

      await expect(
        trustAnchor.connect(issuer2).anchorEvidence(evidenceHash, CONTRACT_VERSION)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");

      await expect(
        trustAnchor.connect(issuer2).anchorIncident(incidentHash, CONTRACT_VERSION)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");

      await expect(
        trustAnchor.connect(issuer2).anchorConsent(consentHash, CONTRACT_VERSION)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");
    });

    it("revoking one issuer does not affect another still-authorized issuer (e.g. the original deployer)", async () => {
      const { trustAnchor, deployer, issuer2 } = await loadFixture(deployTrustAnchorFixture);

      await trustAnchor.authorizeIssuer(issuer2.address);
      await trustAnchor.revokeIssuer(issuer2.address);

      // Deployer (admin, auto-authorized at construction) is untouched.
      expect(await trustAnchor.authorizedIssuers(deployer.address)).to.equal(true);

      const idHash = fakeHash("deployer-still-works-1");
      const tripHash = fakeHash("deployer-still-works-trip-1");
      const issuedAt = await currentBlockTimestamp();
      const expiresAt = issuedAt + ONE_WEEK;

      await expect(
        trustAnchor.issueId(idHash, tripHash, issuedAt, expiresAt, CONTRACT_VERSION)
      ).to.emit(trustAnchor, "IdIssued");
    });
  });

  describe("admin rotation boundary (documented current behavior)", () => {
    it("admin is fixed at the deployer — there is no adminTransfer function in this contract version", async () => {
      // This test documents the MVP's explicit non-goal: no upgradability/
      // admin-transfer function exists (source blueprint §2 "Explicit
      // non-goals"). If a future version adds one, this test should be
      // replaced with a positive transfer test.
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);
      expect((trustAnchor as any).transferAdmin).to.be.undefined;
    });
  });
});
