import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { deployTrustAnchorFixture, fakeHash } from "./fixtures";

const CONTRACT_VERSION = 1;

/**
 * Contract-level state-machine test mirroring the incident timeline story
 * from the source blueprint (§8, incidentAnchor.test.ts spec): an incident
 * moves through CREATED -> ASSIGNED -> RESOLVED, and each state transition
 * produces its own distinct canonical snapshot hash (since the payload —
 * state name + actor + timestamp — is different every time). Each of the
 * three snapshots must anchor independently and remain independently
 * verifiable, demonstrating that tampering with (e.g.) the RESOLVED
 * snapshot after close cannot be done without an anchor mismatch, and that
 * doing so would not affect the CREATED/ASSIGNED anchors already on chain.
 */
describe("TrustAnchor — Incident timeline integrity (multi-snapshot state machine)", () => {
  it("anchors three distinct incident-lifecycle snapshots independently, and all three remain independently verifiable", async () => {
    const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

    // Each snapshot is a DIFFERENT canonical payload (different state +
    // different transitionedAt), so each produces a different incidentHash —
    // this is the whole point: one hash per state transition, not one hash
    // for the whole incident.
    const createdHash = fakeHash("incident-42:CREATED:t=1000");
    const assignedHash = fakeHash("incident-42:ASSIGNED:t=1500");
    const resolvedHash = fakeHash("incident-42:RESOLVED:t=3000");

    // --- CREATED ---
    await expect(trustAnchor.anchorIncident(createdHash, CONTRACT_VERSION)).to.emit(
      trustAnchor,
      "IncidentAnchored"
    );
    let [createdExists] = await trustAnchor.verifyIncident(createdHash);
    expect(createdExists).to.equal(true);

    // Advance chain time between transitions, mirroring real dispatcher
    // timing between an incident being created and being assigned.
    await time.increase(300);

    // --- ASSIGNED ---
    await expect(trustAnchor.anchorIncident(assignedHash, CONTRACT_VERSION)).to.emit(
      trustAnchor,
      "IncidentAnchored"
    );
    let [assignedExists] = await trustAnchor.verifyIncident(assignedHash);
    expect(assignedExists).to.equal(true);

    await time.increase(1500);

    // --- RESOLVED ---
    await expect(trustAnchor.anchorIncident(resolvedHash, CONTRACT_VERSION)).to.emit(
      trustAnchor,
      "IncidentAnchored"
    );
    let [resolvedExists] = await trustAnchor.verifyIncident(resolvedHash);
    expect(resolvedExists).to.equal(true);

    // All three remain independently true/verifiable at the end — anchoring
    // RESOLVED did not overwrite or invalidate CREATED/ASSIGNED, because
    // they live at different mapping keys (different hashes).
    [createdExists] = await trustAnchor.verifyIncident(createdHash);
    [assignedExists] = await trustAnchor.verifyIncident(assignedHash);
    [resolvedExists] = await trustAnchor.verifyIncident(resolvedHash);
    expect(createdExists).to.equal(true);
    expect(assignedExists).to.equal(true);
    expect(resolvedExists).to.equal(true);

    // anchoredAt timestamps must be monotonically increasing, matching the
    // real order incidents progress through — this is what lets an auditor
    // later prove RESOLVED could not have been anchored before CREATED.
    const [, createdAt] = await trustAnchor.verifyIncident(createdHash);
    const [, assignedAt] = await trustAnchor.verifyIncident(assignedHash);
    const [, resolvedAt] = await trustAnchor.verifyIncident(resolvedHash);
    expect(assignedAt).to.be.greaterThan(createdAt);
    expect(resolvedAt).to.be.greaterThan(assignedAt);
  });

  it("a tampered/re-hashed RESOLVED snapshot produces a different hash and is NOT found on-chain (tamper-evidence)", async () => {
    const { trustAnchor } = await loadFixture(deployTrustAnchorFixture);

    const originalResolvedHash = fakeHash("incident-99:RESOLVED:closedBy=officerA:t=5000");
    await trustAnchor.anchorIncident(originalResolvedHash, CONTRACT_VERSION);

    // Simulate someone tampering with the off-chain record after close
    // (e.g. changing who closed it) and recomputing the hash — this
    // produces an entirely different digest.
    const tamperedResolvedHash = fakeHash("incident-99:RESOLVED:closedBy=officerB:t=5000");

    const [originalExists] = await trustAnchor.verifyIncident(originalResolvedHash);
    const [tamperedExists] = await trustAnchor.verifyIncident(tamperedResolvedHash);

    expect(originalExists).to.equal(true);
    // The tampered version was never anchored — recompute-to-verify fails,
    // flagging the record as tampered per the source blueprint's §7
    // "recompute-to-verify" pattern.
    expect(tamperedExists).to.equal(false);
  });

  it("reverts with NOT_AUTHORIZED_ISSUER if an unauthorized actor attempts to anchor any lifecycle snapshot", async () => {
    const { trustAnchor, stranger } = await loadFixture(deployTrustAnchorFixture);

    const createdHash = fakeHash("incident-100:CREATED:t=1");
    await expect(
      trustAnchor.connect(stranger).anchorIncident(createdHash, CONTRACT_VERSION)
    ).to.be.revertedWith("NOT_AUTHORIZED_ISSUER");
  });
});
