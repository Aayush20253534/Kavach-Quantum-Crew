import { Router, Request, Response } from "express";
import {
  ChatbotRequestBody,
  ChatbotSuccessResponse,
  GroqChatCompletionMessage,
} from "./types.js";
import { selectBestKbFile } from "./kbSelector.js";
import { appendMessage, ensureConversation, getConversationHistory, getVisibleHistory, hideHistoryForUser } from "./historyStore.js";
import { callGroq } from "./groqClient.js";

const router = Router();

function userIdFromRequest(req: Request): string | null {
  const user = (req as Request & { user?: { sub?: string } }).user;
  return typeof user?.sub === "string" ? user.sub : null;
}

router.get("/v1/chatbot/history", async (req: Request, res: Response) => {
  const userId = userIdFromRequest(req);
  if (!userId) return res.status(401).json({ success: false, message: "Authentication required", code: "AUTH_REQUIRED" });
  const data = await getVisibleHistory(userId);
  return res.status(200).json({ success: true, message: "Chat history", data });
});

router.delete("/v1/chatbot/history", async (req: Request, res: Response) => {
  const userId = userIdFromRequest(req);
  if (!userId) return res.status(401).json({ success: false, message: "Authentication required", code: "AUTH_REQUIRED" });
  await hideHistoryForUser(userId);
  return res.status(200).json({ success: true, message: "Chat history cleared from your view. Stored audit history was retained." });
});

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

    const normalizedMessage = message.trim();
    const maxMessageLength = Number(process.env.CHATBOT_MAX_MESSAGE_LENGTH || 2000);
    if (normalizedMessage.length > maxMessageLength) {
      return res.status(400).json({
        success: false,
        message: `message must be at most ${maxMessageLength} characters`,
        code: "MESSAGE_TOO_LONG",
      });
    }

    const userId = userIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required", code: "AUTH_REQUIRED" });
    }

    const activeConversationId = await ensureConversation(
      userId,
      conversationId && typeof conversationId === "string" ? conversationId : null,
    );

    const { fileName, content } = selectBestKbFile(normalizedMessage);

    if (!fileName || !content) {
      const fallbackText =
        "I couldn't find relevant information to answer that question.";

      await appendMessage(userId, activeConversationId, { role: "user", content: normalizedMessage });
      await appendMessage(userId, activeConversationId, { role: "assistant", content: fallbackText });

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

    const history = await getConversationHistory(userId, activeConversationId);

    const groqMessages: GroqChatCompletionMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt(fileName, content, location, context),
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: normalizedMessage },
    ];

    const reply = await callGroq(groqMessages);

    await appendMessage(userId, activeConversationId, { role: "user", content: normalizedMessage });
    await appendMessage(userId, activeConversationId, { role: "assistant", content: reply }, [fileName]);

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