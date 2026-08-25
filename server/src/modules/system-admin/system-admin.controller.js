import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { systemAdminService } from "./system-admin.service.js";

export const createSystemAdminController = ({ service = systemAdminService } = {}) => ({
  dashboard: async (request, response) => ApiResponse.success(response, { message: "System admin dashboard", data: await service.dashboard(request.user) }),
  accounts: async (request, response) => ApiResponse.success(response, { message: "Accounts", data: await service.listAccounts(request.user, request.query) }),
  account: async (request, response) => ApiResponse.success(response, { message: "Account", data: await service.getAccount(request.user, request.params.role, request.params.accountId) }),
  status: async (request, response) => ApiResponse.success(response, { message: "Account status updated", data: await service.setAccountStatus(request.user, request.params.role, request.params.accountId, request.body.status, request.body.reason) }),
  destinations: async (request, response) =>
    ApiResponse.success(response, {
      message: "Destinations",
      data: await service.listDestinations(request.user, request.query),
    }),

  createDestination: async (request, response) =>
    ApiResponse.success(response, {
      statusCode: 201,
      message: "Destination created",
      data: await service.createDestination(request.user, request.body),
    }),

  updateDestination: async (request, response) =>
    ApiResponse.success(response, {
      message: "Destination updated",
      data: await service.updateDestination(
        request.user,
        request.params.destinationId,
        request.body,
      ),
    }),

  deleteDestination: async (request, response) =>
    ApiResponse.success(response, {
      message: "Destination deleted",
      data: await service.deleteDestination(
        request.user,
        request.params.destinationId,
      ),
    }),

  uploadDestinationImage: async (request, response) =>
    ApiResponse.success(response, {
      message: "Destination image uploaded",
      data: await service.uploadDestinationImage(
        request.user,
        request.params.destinationId,
        request.file,
      ),
    }),

  resources: async (request, response) => ApiResponse.success(response, { message: "Administrative resources", data: await service.listResource(request.user, request.params.resource, request.query) }),
});

export const systemAdminController = createSystemAdminController();
export default systemAdminController;
