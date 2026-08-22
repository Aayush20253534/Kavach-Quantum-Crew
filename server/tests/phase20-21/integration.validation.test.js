import {
  aiHazardAnalysisBodySchema,
  aiRiskAssessmentBodySchema,
  blockchainEvidenceProofBodySchema,
  blockchainIncidentProofBodySchema,
  blockchainSafetyIdProofBodySchema,
  blockchainVerificationParamsSchema,
} from "../../src/modules/integrations/integration.validation.js";

const hash = "a".repeat(64);
const uuid = "123e4567-e89b-12d3-a456-426614174000";

describe("Phase 20-21 integration validation", () => {
  test("accepts an AI risk-assessment payload", () => {
    const result = aiRiskAssessmentBodySchema.parse({
      tripId: uuid,
      location: {
        latitude: "27.7",
        longitude: "85.3",
      },
    });

    expect(result.location).toEqual({
      latitude: 27.7,
      longitude: 85.3,
    });
    expect(result.context).toEqual({});
  });

  test("accepts an AI hazard-analysis payload", () => {
    expect(
      aiHazardAnalysisBodySchema.safeParse({
        type: "LANDSLIDE",
        description: "Rockfall near the route",
        location: {
          latitude: 27.7,
          longitude: 85.3,
        },
      }).success,
    ).toBe(true);
  });

  test("validates blockchain proof contracts", () => {
    expect(
      blockchainSafetyIdProofBodySchema.safeParse({
        referenceId: "safety-proof-1",
        payloadHash: hash,
        timestamp: "2026-08-22T00:00:00.000Z",
        safetyId: "SID-123",
      }).success,
    ).toBe(true);

    expect(
      blockchainIncidentProofBodySchema.safeParse({
        referenceId: "incident-proof-1",
        payloadHash: hash,
        timestamp: "2026-08-22T00:00:00.000Z",
        incidentId: uuid,
      }).success,
    ).toBe(true);

    expect(
      blockchainEvidenceProofBodySchema.safeParse({
        referenceId: "evidence-proof-1",
        payloadHash: hash,
        timestamp: "2026-08-22T00:00:00.000Z",
        attachmentId: uuid,
      }).success,
    ).toBe(true);
  });

  test("rejects malformed hashes and references", () => {
    expect(
      blockchainIncidentProofBodySchema.safeParse({
        referenceId: "incident-proof-1",
        payloadHash: "not-a-sha256",
        timestamp: "2026-08-22T00:00:00.000Z",
        incidentId: uuid,
      }).success,
    ).toBe(false);

    expect(
      blockchainVerificationParamsSchema.safeParse({
        reference: "",
      }).success,
    ).toBe(false);
  });
});
