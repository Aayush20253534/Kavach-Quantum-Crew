import { jest } from "@jest/globals";

import { createIntegrationService } from "../../src/modules/integrations/integration.service.js";

const admin = { id: "admin-1", role: "SYSTEM_ADMIN" };
const manager = { id: "dm-1", role: "DISASTER_MANAGER" };

describe("Phase 20-21 integration service", () => {
  test("exposes integration capabilities to staff", () => {
    const service = createIntegrationService();

    expect(service.capabilities(admin)).toEqual({
      ai: {
        riskAssessment: true,
        hazardAnalysis: true,
        providerConfigured: false,
      },
      blockchain: {
        safetyIdProof: true,
        incidentProof: true,
        evidenceProof: true,
        verification: true,
        providerConfigured: false,
      },
    });
  });

  test("forwards AI risk requests to an injected provider", async () => {
    const ai = {
      riskAssessment: jest.fn().mockResolvedValue({
        riskScore: 0.82,
        riskLevel: "HIGH",
      }),
      hazardAnalysis: jest.fn(),
    };

    const service = createIntegrationService({
      ai,
      blockchain: {
        safetyIdProof: jest.fn(),
        incidentProof: jest.fn(),
        evidenceProof: jest.fn(),
        verifyReference: jest.fn(),
      },
    });

    const payload = {
      tripId: "123e4567-e89b-12d3-a456-426614174000",
      location: { latitude: 27.7, longitude: 85.3 },
      context: {},
    };

    await expect(
      service.aiRiskAssessment(manager, payload),
    ).resolves.toEqual({
      riskScore: 0.82,
      riskLevel: "HIGH",
    });

    expect(ai.riskAssessment).toHaveBeenCalledWith(payload);
  });

  test("forwards blockchain proof requests to an injected provider", async () => {
    const blockchain = {
      safetyIdProof: jest.fn(),
      incidentProof: jest.fn().mockResolvedValue({
        reference: "chain-ref-1",
        status: "ACCEPTED",
      }),
      evidenceProof: jest.fn(),
      verifyReference: jest.fn(),
    };

    const service = createIntegrationService({
      ai: {
        riskAssessment: jest.fn(),
        hazardAnalysis: jest.fn(),
      },
      blockchain,
    });

    const payload = {
      referenceId: "incident-proof-1",
      payloadHash: "a".repeat(64),
      timestamp: new Date("2026-08-22T00:00:00.000Z"),
      incidentId: "123e4567-e89b-12d3-a456-426614174000",
    };

    await expect(
      service.blockchainIncidentProof(admin, payload),
    ).resolves.toEqual({
      reference: "chain-ref-1",
      status: "ACCEPTED",
    });

    expect(blockchain.incidentProof).toHaveBeenCalledWith(payload);
  });

  test("rejects tourist access before invoking providers", () => {
    const ai = {
      riskAssessment: jest.fn(),
      hazardAnalysis: jest.fn(),
    };

    const service = createIntegrationService({
      ai,
      blockchain: {
        safetyIdProof: jest.fn(),
        incidentProof: jest.fn(),
        evidenceProof: jest.fn(),
        verifyReference: jest.fn(),
      },
    });

    expect(() =>
      service.capabilities({ id: "tourist-1", role: "TOURIST" }),
    ).toThrow("Integration access requires emergency staff");

    expect(ai.riskAssessment).not.toHaveBeenCalled();
  });
});
