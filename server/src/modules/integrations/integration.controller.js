import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { integrationService } from "./integration.service.js";

export const createIntegrationController = ({
  service = integrationService,
} = {}) => ({
  capabilities(req, res) {
    const data = service.capabilities(req.user);
    return res.status(200).json(
      ApiResponse.success(data, "Integration capabilities"),
    );
  },

  async aiRiskAssessment(req, res) {
    const data = await service.aiRiskAssessment(req.user, req.body);
    return res.status(200).json(ApiResponse.success(data));
  },

  async aiHazardAnalysis(req, res) {
    const data = await service.aiHazardAnalysis(req.user, req.body);
    return res.status(200).json(ApiResponse.success(data));
  },

  async blockchainSafetyIdProof(req, res) {
    const data = await service.blockchainSafetyIdProof(req.user, req.body);
    return res.status(200).json(ApiResponse.success(data));
  },

  async blockchainIncidentProof(req, res) {
    const data = await service.blockchainIncidentProof(req.user, req.body);
    return res.status(200).json(ApiResponse.success(data));
  },

  async blockchainEvidenceProof(req, res) {
    const data = await service.blockchainEvidenceProof(req.user, req.body);
    return res.status(200).json(ApiResponse.success(data));
  },

  async blockchainVerify(req, res) {
    const data = await service.blockchainVerify(
      req.user,
      req.params.reference,
    );

    return res.status(200).json(ApiResponse.success(data));
  },
});

export const integrationController = createIntegrationController();

export default integrationController;
