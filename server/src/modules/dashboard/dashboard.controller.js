import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { dashboardService } from "./dashboard.service.js";

export const createDashboardController = ({ service = dashboardService } = {}) => ({
  tourist: async (request, response) =>
    ApiResponse.success(response, { data: await service.touristSummary(request.user.id, request.query) }),
});

export const dashboardController = createDashboardController();
export default dashboardController;
