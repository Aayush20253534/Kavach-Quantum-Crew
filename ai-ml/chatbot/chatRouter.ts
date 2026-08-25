import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  ChatbotRequestBody,
  ChatbotSuccessResponse,
  GroqChatCompletionMessage,
} from "./types";
import { selectBestKbFile } from "./kbSelector";
import { getHistory, appendToHistory } from "./memoryStore";
import { callGroq } from "./groqClient";

const router = Router();

function buildSystemPrompt(
  fileName: string,
  fileContent: string,
  location?: { latitude: number; longitude: number },
  context?: Record<string, unknown>
): string {
  const parts = [
    "You are a helpful assistant for the Smart Tourist Safety platform.",
    "Answer the user's question using ONLY the information in the document below.",
    "If the document does not contain the answer, say you don't have enough information — do not make things up.",
  ];

  if (location) {
    parts.push(
      `The tourist's current location is latitude ${location.latitude}, longitude ${location.longitude}. Use this only if relevant to the question.`
    );
  }

  if (context && Object.keys(context).length > 0) {
    parts.push(`Additional context: ${JSON.stringify(context)}`);
  }

  parts.push(
    "",
    `--- Document: ${fileName} ---`,
    fileContent,
    "--- End of document ---"
  );

  return parts.join("\n");
}

router.post("/v1/chatbot/messages", async (req: Request, res: Response) => {
  try {
    // Provider not configured yet — preserve the documented 501 behavior.
    if (!process.env.GROQ_API_KEY) {
      return res.status(501).json({
        success: false,
        message: "Chatbot provider is not configured",
        code: "CHATBOT_PROVIDER_NOT_CONFIGURED",
      });
    }

    const { message, conversationId, location, context } =
      req.body as Partial<ChatbotRequestBody>;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "message is required",
        code: "INVALID_REQUEST",
      });
    }

    // conversationId doubles as the session key for chat memory.
    // Generate a fresh one when the client sends null (new conversation).
    const activeConversationId =
      conversationId && typeof conversationId === "string"
        ? conversationId
        : randomUUID();

    const { fileName, content } = selectBestKbFile(message);

    if (!fileName || !content) {
      const fallbackText =
        "I couldn't find relevant information to answer that question.";

      appendToHistory(activeConversationId, { role: "user", content: message });
      appendToHistory(activeConversationId, { role: "assistant", content: fallbackText });

      const body: ChatbotSuccessResponse = {
        success: true,
        message: "Chatbot response",
        data: {
          conversationId: activeConversationId,
          message: fallbackText,
          sources: [],
          suggestedActions: [],
        },
      };
      return res.status(200).json(body);
    }

    const history = getHistory(activeConversationId);

    const groqMessages: GroqChatCompletionMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt(fileName, content, location, context),
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const reply = await callGroq(groqMessages);

    appendToHistory(activeConversationId, { role: "user", content: message });
    appendToHistory(activeConversationId, { role: "assistant", content: reply });

    const body: ChatbotSuccessResponse = {
      success: true,
      message: "Chatbot response",
      data: {
        conversationId: activeConversationId,
        message: reply,
        sources: [fileName],
        suggestedActions: [],
      },
    };
    return res.status(200).json(body);
  } catch (err) {
    console.error("Chatbot route error:", err);
    const details = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
      details,
    });
  }
});

export default router;