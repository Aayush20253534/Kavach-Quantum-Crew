import { ApiError } from "../../common/errors/ApiError.js";

export const createChatbotProvider = ({ respond } = {}) => Object.freeze({
  async respond(payload) {
    if (!respond) {
      throw new ApiError(
        501,
        "Chatbot AI provider is not configured",
        { code: "CHATBOT_PROVIDER_NOT_CONFIGURED" },
      );
    }

    return respond(payload);
  },
});

export const chatbotProvider = createChatbotProvider();
export default chatbotProvider;
