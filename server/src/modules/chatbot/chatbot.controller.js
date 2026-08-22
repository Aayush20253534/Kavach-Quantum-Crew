import { ApiResponse } from "../../common/responses/ApiResponse.js";
import { chatbotService } from "./chatbot.service.js";

export const createChatbotController = ({ service = chatbotService } = {}) => ({
  sendMessage: async (request, response) =>
    ApiResponse.success(response, {
      message: "Chatbot response",
      data: await service.sendMessage(request.user, request.body),
    }),
});

export const chatbotController = createChatbotController();
export default chatbotController;
