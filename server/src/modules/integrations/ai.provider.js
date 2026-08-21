import { ApiError } from "../../common/errors/ApiError.js";

export const createAiProvider = ({
  riskAssessment,
  hazardAnalysis,
} = {}) => Object.freeze({
  async riskAssessment(payload) {
    if (!riskAssessment) {
      throw new ApiError(
        501,
        "AI integration provider is not configured",
        { code: "INTEGRATION_PROVIDER_NOT_CONFIGURED" },
      );
    }

    return riskAssessment(payload);
  },

  async hazardAnalysis(payload) {
    if (!hazardAnalysis) {
      throw new ApiError(
        501,
        "AI integration provider is not configured",
        { code: "INTEGRATION_PROVIDER_NOT_CONFIGURED" },
      );
    }

    return hazardAnalysis(payload);
  },
});

export const aiProvider = createAiProvider();

export default aiProvider;
