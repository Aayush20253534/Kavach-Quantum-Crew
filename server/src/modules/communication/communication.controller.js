import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { communicationService } from "./communication.service.js";

export const createCommunicationController = ({ service = communicationService } = {}) => ({
  list: async (request, response) =>
    ApiResponse.success(response, {
      message: "Incident messages",
      data: await service.list(request.user, request.params.incidentId, request.query),
    }),

  send: async (request, response) =>
    ApiResponse.success(response, {
      statusCode: 201,
      message: "Incident message sent",
      data: await service.send(request.user, request.params.incidentId, request.body),
    }),
});

export const communicationController = createCommunicationController();

export default communicationController;
