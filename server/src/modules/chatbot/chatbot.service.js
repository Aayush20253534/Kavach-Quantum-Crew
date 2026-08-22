import { randomUUID } from "node:crypto";

import { ApiError } from "../../common/errors/ApiError.js";
import { ROLES } from "../../constants/roles.js";
import { chatbotProvider } from "./chatbot.provider.js";

export const createChatbotService = ({ provider = chatbotProvider } = {}) => ({
  async sendMessage(actor, input) {
    if (actor?.role !== ROLES.TOURIST) {
      throw ApiError.forbidden("Chatbot access is limited to tourist accounts", {
        code: "CHATBOT_ACCESS_FORBIDDEN",
      });
    }

    const conversationId = input.conversationId ?? randomUUID();
    const result = await provider.respond({
      user: { id: actor.id, role: actor.role },
      conversationId,
      message: input.message,
      location: input.location ?? null,
      context: input.context ?? {},
    });

    return {
      conversationId,
      message: result?.message ?? "",
      sources: Array.isArray(result?.sources) ? result.sources : [],
      suggestedActions: Array.isArray(result?.suggestedActions)
        ? result.suggestedActions
        : [],
      metadata: result?.metadata ?? undefined,
    };
  },
});

export const chatbotService = createChatbotService();
export default chatbotService;
