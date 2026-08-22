import { jest } from "@jest/globals";

import { createChatbotService } from "../../src/modules/chatbot/chatbot.service.js";

const tourist = { id: "tourist-1", role: "TOURIST" };

describe("Phase 26 chatbot service", () => {
  test("forwards a tourist message to the injected AI provider", async () => {
    const provider = {
      respond: jest.fn().mockResolvedValue({
        message: "Sangam is currently operating normally.",
        sources: [{ type: "advisory", id: "adv-1" }],
        suggestedActions: ["Stay inside marked safe zones"],
      }),
    };
    const service = createChatbotService({ provider });

    const result = await service.sendMessage(tourist, {
      message: "Is Sangam safe?",
      location: { latitude: 25.4358, longitude: 81.8463 },
      context: {},
    });

    expect(result.conversationId).toEqual(expect.any(String));
    expect(result.message).toContain("Sangam");
    expect(provider.respond).toHaveBeenCalledWith(
      expect.objectContaining({
        user: tourist,
        message: "Is Sangam safe?",
      }),
    );
  });

  test("rejects non-tourist access", async () => {
    const provider = { respond: jest.fn() };
    const service = createChatbotService({ provider });

    await expect(
      service.sendMessage({ id: "admin-1", role: "SYSTEM_ADMIN" }, { message: "Hi" }),
    ).rejects.toMatchObject({ code: "CHATBOT_ACCESS_FORBIDDEN" });
    expect(provider.respond).not.toHaveBeenCalled();
  });
});
