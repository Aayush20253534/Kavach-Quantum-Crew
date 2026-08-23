import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployTrustAnchorFixture } from "./fixtures";

// Adjust this import path if your adapter package lives elsewhere relative
// to blockchain/test/ — per the blueprint (§7) the adapter is at
// blockchain/adapter/, so from blockchain/test/ that's "../adapter".
import {
  hashPayload,
  hashEvidenceManifest,
  hashIncidentSnapshot,
  hashConsentReceipt,
  hashIdPayload,
} from "../adapter/hasher";

import fixtures from "./fixtures/canonicalHashes.json";

const CONTRACT_VERSION = 1;

describe("Hash determinism regression + on-chain re-anchor idempotency", () => {
  /**
   * ---------------------------------------------------------------------
   * PART 1 — Determinism regression test (spec: test/idempotency.test.ts,
   * blueprint §8): guards against a future refactor of canonicalize.ts
   * (e.g. swapping the canonical-JSON library) silently changing digests
   * for records that were already anchored on-chain under the old
   * implementation. If any of these assertions ever fail after an
   * intentional change, it means every previously-issued proof under the
   * current CONTRACT_VERSION is no longer reproducible — that requires a
   * version bump, not a fixture update.
   * ---------------------------------------------------------------------
   */
  describe("hasher.ts determinism vs. committed fixture", () => {
    it("hashEvidenceManifest matches the committed expected digest", () => {
      const { fileChecksumSha256, actorId, orgId, transferredAt, version } =
        fixtures.evidenceManifest.input;
      const actual = hashEvidenceManifest(
        fileChecksumSha256,
        actorId,
        orgId,
        transferredAt,
        version
      );
      expect(actual).to.equal(fixtures.evidenceManifest.expectedHash);
    });

    it("hashIncidentSnapshot matches the committed expected digest", () => {
      const { incidentId, state, transitionedAt, actorId, version } =
        fixtures.incidentSnapshot.input;
      const actual = hashIncidentSnapshot(incidentId, state, transitionedAt, actorId, version);
      expect(actual).to.equal(fixtures.incidentSnapshot.expectedHash);
    });

    it("hashConsentReceipt matches the committed expected digest", () => {
      const { tripId, consentVersion, orgId, role, windowStart, windowEnd, version } =
        fixtures.consentReceipt.input;
      const actual = hashConsentReceipt(
        tripId,
        consentVersion,
        orgId,
        role,
        windowStart,
        windowEnd,
        version
      );
      expect(actual).to.equal(fixtures.consentReceipt.expectedHash);
    });

    it("hashIdPayload (salted) matches the committed expected digest", () => {
      const { touristIdSeq, tripId, version, salt } = fixtures.idPayload.input;
      const actual = hashIdPayload(touristIdSeq, tripId, version, salt);
      expect(actual).to.equal(fixtures.idPayload.expectedHash);
    });

    it("hashPayload is stable regardless of input key insertion order (canonicalization guarantee)", () => {
      const version = "trust-anchor-v1";

      const payloadOrderA = { alpha: 1, beta: "two", gamma: true };
      const payloadOrderB = { gamma: true, alpha: 1, beta: "two" };

      const hashA = hashPayload(payloadOrderA, version);
      const hashB = hashPayload(payloadOrderB, version);

      expect(hashA).to.equal(hashB);
    });

    it("hashPayload changes when the version tag changes, even for identical data", () => {
      const payload = { alpha: 1, beta: "two" };

      const hashV1 = hashPayload(payload, "trust-anchor-v1");
      const hashV2 = hashPayload(payload, "trust-anchor-v2");

      expect(hashV1).to.not.equal(hashV2);
    });

    it("hashPayload changes when a salt is applied vs. when it is not", () => {
      const payload = { touristIdSeq: 42 };
      const version = "trust-anchor-v1";

      const unsalted = hashPayload(payload, version);
      const salted = hashPayload(payload, version, "some-random-salt");

      expect(unsalted).to.not.equal(salted);
    });

    it("hashPayload is deterministic across repeated calls with the same input", () => {
      const payload = { touristIdSeq: 99, tripId: "trip-abc" };
      const version = "trust-anchor-v1";
      const salt = "fixed-salt-value";

      const first = hashPayload(payload, version, salt);
      const second = hashPayload(payload, version, salt);

      expect(first).to.equal(second);
    });
  });

  /**
   * ---------------------------------------------------------------------
   * PART 2 — On-chain re-anchor idempotency (spec: "Re-anchoring the same
   * evidence hash through the full submit -> wait -> submit-again path
   * ... produces only one EvidenceAnchored event total"). This exercises
   * the contract directly (ChainClient-equivalent calls) rather than going
   * through the full jobQueue worker loop, since the worker loop depends
   * on your Prisma/PostgreSQL setup which isn't available in this
   * Hardhat test environment. If you want an end-to-end jobQueue version
   * of this test, mock Prisma and import runWorkerOnce from
   * "../adapter/jobQueue" following the same submit -> wait -> submit
   * -again shape used below.
   * ---------------------------------------------------------------------
   */
  describe("On-chain re-anchor idempotency (submit -> wait -> submit-again)", () => {
    it("produces exactly ONE EvidenceAnchored event total across two submissions of the same hash", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const evidenceHash = hashEvidenceManifest(
        "abc123checksum",
        "actor-1",
        "org-1",
        1755680400,
        "trust-anchor-v1"
      );

      // First submission: real anchor, should emit exactly one event.
      const firstTx = await trustAnchor.anchorEvidence(evidenceHash, CONTRACT_VERSION);
      const firstReceipt = await firstTx.wait();
      const firstEventCount = firstReceipt!.logs.filter((log: any) => {
        try {
          return trustAnchor.interface.parseLog(log)?.name === "EvidenceAnchored";
        } catch {
          return false;
        }
      }).length;
      expect(firstEventCount).to.equal(1);

      // Second submission ("resubmitting a job for an already-anchored
      // hash"): must not revert, and must emit zero additional events.
      const secondTx = await trustAnchor.anchorEvidence(evidenceHash, CONTRACT_VERSION);
      const secondReceipt = await secondTx.wait();
      const secondEventCount = secondReceipt!.logs.filter((log: any) => {
        try {
          return trustAnchor.interface.parseLog(log)?.name === "EvidenceAnchored";
        } catch {
          return false;
        }
      }).length;
      expect(secondEventCount).to.equal(0);

      // Confirms the total across both submissions is exactly one.
      expect(firstEventCount + secondEventCount).to.equal(1);
    });

    it("same idempotency guarantee holds for anchorIncident", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const incidentHash = hashIncidentSnapshot(
        "incident-77",
        "RESOLVED",
        1755680400,
        "dispatcher-3",
        "trust-anchor-v1"
      );

      await trustAnchor.anchorIncident(incidentHash, CONTRACT_VERSION);
      const secondTx = await trustAnchor.anchorIncident(incidentHash, CONTRACT_VERSION);
      const secondReceipt = await secondTx.wait();

      const events = secondReceipt!.logs.filter((log: any) => {
        try {
          return trustAnchor.interface.parseLog(log)?.name === "IncidentAnchored";
        } catch {
          return false;
        }
      });
      expect(events.length).to.equal(0);
    });

    it("same idempotency guarantee holds for anchorConsent", async () => {
      const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

      const consentHash = hashConsentReceipt(
        "trip-556",
        "consent-v2",
        "org-disaster-mgmt",
        "coordinator",
        1755680400,
        1755766800,
        "trust-anchor-v1"
      );

      await trustAnchor.anchorConsent(consentHash, CONTRACT_VERSION);
      const secondTx = await trustAnchor.anchorConsent(consentHash, CONTRACT_VERSION);
      const secondReceipt = await secondTx.wait();

      const events = secondReceipt!.logs.filter((log: any) => {
        try {
          return trustAnchor.interface.parseLog(log)?.name === "ConsentAnchored";
        } catch {
          return false;
        }
      });
      expect(events.length).to.equal(0);
    });
  });
});
