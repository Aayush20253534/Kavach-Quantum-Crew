import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployTrustAnchorFixture, fakeHash } from "./fixtures";

const CONTRACT_VERSION = 1;

/**
 * These three describe-blocks mirror each other exactly (anchorEvidence,
 * anchorIncident, anchorConsent all share the same idempotent-anchor
 * pattern in TrustAnchor.sol — §2 / §8 of the blueprint). Kept as three
 * explicit blocks rather than a parameterized loop so failures point
 * directly at the anchor type that broke, and so this file reads as a
 * straightforward mirror of the source spec's three "Asserts" bullets
 * applied to evidence, incident, and consent anchors.
 */

describe("TrustAnchor — Evidence / Incident / Consent anchoring", () => {
  describe("anchorEvidence / verifyEvidence", () => {
    it("succeeds from an authorized issuer, emits EvidenceAnchored, and verifyEvidence returns exists=true with a non-zero timestamp", async () => {
      const { trustAnchor, deployer } = await loadFixture(deployTrustAnchorFixture);
      const evidenceHash = fakeHash("evidence-manifest-1");

      const tx = await trustAnchor.anchorEvidence(evidenceHash, CONTRACT_VERSION);
      const receipt = await tx.wait();
      const block = await trustAnchor.runner!.provider!.getBlock(receipt!.blockNumber);
      const anchoredAtExpected = BigInt(block!.timestamp);

      await expect(tx)
        .to.emit(trustAnchor, "EvidenceAnchored")
        .withArgs(evidenceHash, deployer.address, anchoredAtExpected, CONTRACT_VERSION);

      const [exists, anchoredAt] = await trustAnchor.verifyEvidence(evidenceHash);
      expect(exists).to.equal(true);
      expect(anchoredAt).to.be.greaterThan(0n);
      expect(anchoredAt).to.equal(anchoredAtExpected);
    });

    it("is idempotent: anchoring the same hash twice does not revert and emits zero events on the second call", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);
      const evidenceHash = fakeHash("evidence-manifest-2");

      await trustAnchor.anchorEvidence(evidenceHash, CONTRACT_VERSION);
      const [, firstAnchoredAt] = await trustAnchor.verifyEvidence(evidenceHash);

      // Second call must not revert...
      const secondTx = await trustAnchor.anchorEvidence(evidenceHash, CONTRACT_VERSION);
      const secondReceipt = await secondTx.wait();

      // ...and must emit ZERO EvidenceAnchored events (not a second one).
      const evidenceEvents = secondReceipt!.logs.filter((log) => {
        try {
          return trustAnchor.interface.parseLog(log as any)?.name === "EvidenceAnchored";
        } catch {
          return false;
        }
      });
      expect(evidenceEvents.length).to.equal(0);

      // The stored anchoredAt timestamp must be unchanged (not overwritten).
      const [, secondAnchoredAt] = await trustAnchor.verifyEvidence(evidenceHash);
      expect(secondAnchoredAt).to.equal(firstAnchoredAt);
    });

    it("reverts with NOT_AUTHORIZED_ISSUER when called by an unauthorized address", async () => {
      const { trustAnchor, stranger } = await loadFixture(deployTrustAnchorFixture);
      const evidenceHash = fakeHash("evidence-manifest-3");

      await expect(
        trustAnchor.connect(stranger).anchorEvidence(evidenceHash, CONTRACT_VERSION)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");
    });

    it("verifyEvidence on a never-anchored hash returns exists=false and anchoredAt=0", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);
      const neverAnchored = fakeHash("never-anchored-evidence");

      const [exists, anchoredAt] = await trustAnchor.verifyEvidence(neverAnchored);
      expect(exists).to.equal(false);
      expect(anchoredAt).to.equal(0n);
    });
  });

  describe("anchorIncident / verifyIncident", () => {
    it("succeeds from an authorized issuer, emits IncidentAnchored, and verifyIncident returns exists=true with a non-zero timestamp", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);
      const incidentHash = fakeHash("incident-snapshot-1");

      await expect(trustAnchor.anchorIncident(incidentHash, CONTRACT_VERSION)).to.emit(
        trustAnchor,
        "IncidentAnchored"
      );

      const [exists, anchoredAt] = await trustAnchor.verifyIncident(incidentHash);
      expect(exists).to.equal(true);
      expect(anchoredAt).to.be.greaterThan(0n);
    });

    it("is idempotent: anchoring the same incident hash twice emits zero events on the second call", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);
      const incidentHash = fakeHash("incident-snapshot-2");

      await trustAnchor.anchorIncident(incidentHash, CONTRACT_VERSION);
      const secondTx = await trustAnchor.anchorIncident(incidentHash, CONTRACT_VERSION);
      const secondReceipt = await secondTx.wait();

      const incidentEvents = secondReceipt!.logs.filter((log) => {
        try {
          return trustAnchor.interface.parseLog(log as any)?.name === "IncidentAnchored";
        } catch {
          return false;
        }
      });
      expect(incidentEvents.length).to.equal(0);
    });

    it("reverts with NOT_AUTHORIZED_ISSUER when called by an unauthorized address", async () => {
      const { trustAnchor, stranger } = await loadFixture(deployTrustAnchorFixture);
      const incidentHash = fakeHash("incident-snapshot-3");

      await expect(
        trustAnchor.connect(stranger).anchorIncident(incidentHash, CONTRACT_VERSION)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");
    });
  });

  describe("anchorConsent / verifyConsent", () => {
    it("succeeds from an authorized issuer, emits ConsentAnchored, and verifyConsent returns exists=true", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);
      const consentHash = fakeHash("consent-receipt-1");

      await expect(trustAnchor.anchorConsent(consentHash, CONTRACT_VERSION)).to.emit(
        trustAnchor,
        "ConsentAnchored"
      );

      const exists = await trustAnchor.verifyConsent(consentHash);
      expect(exists).to.equal(true);
    });

    it("is idempotent: anchoring the same consent hash twice emits zero events on the second call", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);
      const consentHash = fakeHash("consent-receipt-2");

      await trustAnchor.anchorConsent(consentHash, CONTRACT_VERSION);
      const secondTx = await trustAnchor.anchorConsent(consentHash, CONTRACT_VERSION);
      const secondReceipt = await secondTx.wait();

      const consentEvents = secondReceipt!.logs.filter((log) => {
        try {
          return trustAnchor.interface.parseLog(log as any)?.name === "ConsentAnchored";
        } catch {
          return false;
        }
      });
      expect(consentEvents.length).to.equal(0);
    });

    it("reverts with NOT_AUTHORIZED_ISSUER when called by an unauthorized address", async () => {
      const { trustAnchor, stranger } = await loadFixture(deployTrustAnchorFixture);
      const consentHash = fakeHash("consent-receipt-3");

      await expect(
        trustAnchor.connect(stranger).anchorConsent(consentHash, CONTRACT_VERSION)
      ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");
    });
  });
});

