import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { destinationService } from "./destination.service.js";

export const createDestinationController = ({ service = destinationService } = {}) => ({
  list: async (request, response) =>
    ApiResponse.success(response, { data: await service.list(request.query) }),
});

export const destinationController = createDestinationController();
export default destinationController;
