import { ApiError } from "../../common/errors/ApiError.js";

import { aiProvider } from "./ai.provider.js";
import { blockchainProvider } from "./blockchain.provider.js";

const STAFF = new Set(["DISASTER_MANAGER", "SYSTEM_ADMIN"]);

export const createIntegrationService = ({
  ai = aiProvider,
  blockchain = blockchainProvider,
} = {}) => {
  const requireStaff = (actor) => {
    if (!STAFF.has(actor.role)) {
      throw ApiError.forbidden(
        "Integration access requires emergency staff",
        { code: "INTEGRATION_ACCESS_FORBIDDEN" },
      );
    }
  };

  return Object.freeze({
    capabilities(actor) {
      requireStaff(actor);

      return {
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
      };
    },

    async aiRiskAssessment(actor, payload) {
      requireStaff(actor);
      return ai.riskAssessment(payload);
    },

    async aiHazardAnalysis(actor, payload) {
      requireStaff(actor);
      return ai.hazardAnalysis(payload);
    },

    async blockchainSafetyIdProof(actor, payload) {
      requireStaff(actor);
      return blockchain.safetyIdProof(payload);
    },

    async blockchainIncidentProof(actor, payload) {
      requireStaff(actor);
      return blockchain.incidentProof(payload);
    },

    async blockchainEvidenceProof(actor, payload) {
      requireStaff(actor);
      return blockchain.evidenceProof(payload);
    },

    async blockchainVerify(actor, reference) {
      requireStaff(actor);
      return blockchain.verifyReference(reference);
    },
  });
};

export const integrationService = createIntegrationService();

export default integrationService;
