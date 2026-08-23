import { chatbotMessageBodySchema } from "../../src/modules/chatbot/chatbot.validation.js";

describe("Phase 26 chatbot validation", () => {
  test("accepts message, location and context", () => {
    const result = chatbotMessageBodySchema.parse({
      message: "Nearest hospital?",
      location: { latitude: "25.43", longitude: "81.84" },
    });
    expect(result.location).toEqual({ latitude: 25.43, longitude: 81.84 });
    expect(result.context).toEqual({});
  });

  test("rejects empty and oversized messages", () => {
    expect(chatbotMessageBodySchema.safeParse({ message: "" }).success).toBe(false);
    expect(chatbotMessageBodySchema.safeParse({ message: "x".repeat(2001) }).success).toBe(false);
  });
});
