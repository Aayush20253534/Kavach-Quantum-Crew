import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { auditService } from "./audit.service.js";

export const createAuditController = ({ service = auditService } = {}) => ({
  async list(request, response) {
    return ApiResponse.success(response, {
      message: "Audit events retrieved",
      data: await service.list(request.user, request.query),
    });
  },

  async summary(request, response) {
    return ApiResponse.success(response, {
      message: "Audit summary retrieved",
      data: await service.summary(request.user, request.query),
    });
  },
});

export const auditController = createAuditController();
export default auditController;
