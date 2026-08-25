import { ApiError } from "../../common/errors/ApiError.js";

export const createBlockchainProvider = ({
  safetyIdProof,
  incidentProof,
  evidenceProof,
  verifyReference,
} = {}) => Object.freeze({
  async safetyIdProof(payload) {
    if (!safetyIdProof) {
      throw new ApiError(
        501,
        "Blockchain integration provider is not configured",
        { code: "INTEGRATION_PROVIDER_NOT_CONFIGURED" },
      );
    }

    return safetyIdProof(payload);
  },

  async incidentProof(payload) {
    if (!incidentProof) {
      throw new ApiError(
        501,
        "Blockchain integration provider is not configured",
        { code: "INTEGRATION_PROVIDER_NOT_CONFIGURED" },
      );
    }

    return incidentProof(payload);
  },

  async evidenceProof(payload) {
    if (!evidenceProof) {
      throw new ApiError(
        501,
        "Blockchain integration provider is not configured",
        { code: "INTEGRATION_PROVIDER_NOT_CONFIGURED" },
      );
    }

    return evidenceProof(payload);
  },

  async verifyReference(reference) {
    if (!verifyReference) {
      throw new ApiError(
        501,
        "Blockchain integration provider is not configured",
        { code: "INTEGRATION_PROVIDER_NOT_CONFIGURED" },
      );
    }

    return verifyReference(reference);
  },
});

export const blockchainProvider = createBlockchainProvider();

export default blockchainProvider;
