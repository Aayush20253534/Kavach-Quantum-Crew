import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { systemAdminService } from "./system-admin.service.js";

export const createSystemAdminController = ({ service = systemAdminService } = {}) => ({
  dashboard: async (request, response) => ApiResponse.success(response, { message: "System admin dashboard", data: await service.dashboard(request.user) }),
  accounts: async (request, response) => ApiResponse.success(response, { message: "Accounts", data: await service.listAccounts(request.user, request.query) }),
  account: async (request, response) => ApiResponse.success(response, { message: "Account", data: await service.getAccount(request.user, request.params.role, request.params.accountId) }),
  status: async (request, response) => ApiResponse.success(response, { message: "Account status updated", data: await service.setAccountStatus(request.user, request.params.role, request.params.accountId, request.body.status, request.body.reason) }),
  resources: async (request, response) => ApiResponse.success(response, { message: "Administrative resources", data: await service.listResource(request.user, request.params.resource, request.query) }),
});

export const systemAdminController = createSystemAdminController();
export default systemAdminController;
