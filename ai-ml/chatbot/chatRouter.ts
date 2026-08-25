import { Router, Request, Response } from "express";
import {
  ChatbotRequestBody,
  ChatbotSuccessResponse,
  GroqChatCompletionMessage,
} from "./types.js";
import { selectBestKbFile } from "./kbSelector.js";
import { appendMessage, ensureConversation, getConversationHistory, getVisibleHistory, hideHistoryForUser } from "./historyStore.js";
import { callGroq } from "./groqClient.js";
import { fetchNearestSafeZones, isNearestSafeZoneIntent, NearbySafeZone } from "./kavachContext.js";

const router = Router();

function userIdFromRequest(req: Request): string | null {
  const user = (req as Request & { user?: { sub?: string } }).user;
  return typeof user?.sub === "string" ? user.sub : null;
}

function bearerTokenFromRequest(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
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

function buildSystemPrompt({
  fileName,
  fileContent,
  location,
  context,
  nearbySafeZones,
}: {
  fileName: string | null;
  fileContent: string | null;
  location?: { latitude: number; longitude: number };
  context?: Record<string, unknown>;
  nearbySafeZones?: NearbySafeZone[];
}): string {
  const parts = [
    "You are Rakshak AI, the Kavach travel and tourist-safety assistant.",
    "Be natural and conversational for greetings, introductions, thanks, and ordinary conversation.",
    "For Kavach-specific factual questions, use supplied knowledge-base or live application context when available and do not invent platform behavior.",
    "Live application context is more authoritative than static knowledge-base text.",
    "If a Kavach-specific fact is not available in either source, clearly say that you do not have that information instead of fabricating it.",
    "Never claim that you triggered SOS, dispatched responders, changed a trip, or performed another real application action unless the supplied context explicitly says that action happened.",
    "Use recent conversation history to understand references and details the user has voluntarily shared during the chat.",
  ];

  if (location) {
    parts.push(`The tourist's current browser location is latitude ${location.latitude}, longitude ${location.longitude}.`);
  }

  if (nearbySafeZones) {
    if (nearbySafeZones.length > 0) {
      parts.push(
        "Live Kavach safe-zone results, ordered nearest first:",
        JSON.stringify(nearbySafeZones.map((zone) => ({
          id: zone.id,
          name: zone.name,
          description: zone.description ?? null,
          latitude: zone.latitude,
          longitude: zone.longitude,
          radiusM: zone.radiusM ?? null,
          distanceM: Math.round(zone.distanceM),
        }))),
        "When answering a nearest-safe-zone question, name the nearest result and give an approximate distance. Mention that it is based on the user's current browser location.",
      );
    } else {
      parts.push("The live Kavach safe-zone lookup returned no active safe zones with usable coordinates.");
    }
  }

  if (context && Object.keys(context).length > 0) {
    parts.push(`Additional application context: ${JSON.stringify(context)}`);
  }

  if (fileName && fileContent) {
    parts.push(
      "",
      `--- Kavach knowledge-base document: ${fileName} ---`,
      fileContent,
      "--- End knowledge-base document ---",
    );
  } else {
    parts.push("No relevant static Kavach knowledge-base document was selected for this message. This does not prevent normal conversation or answers based on live application context.");
  }

  return parts.join("\n");
}

router.post("/v1/chatbot/messages", async (req: Request, res: Response) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(501).json({
        success: false,
        message: "Chatbot provider is not configured",
        code: "CHATBOT_PROVIDER_NOT_CONFIGURED",
      });
    }

    const { message, conversationId, location, context } = req.body as Partial<ChatbotRequestBody>;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "message is required", code: "INVALID_REQUEST" });
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

    const history = await getConversationHistory(userId, activeConversationId);
    const { fileName, content } = selectBestKbFile(normalizedMessage);
    const wantsNearestSafeZone = isNearestSafeZoneIntent(normalizedMessage);

    let nearbySafeZones: NearbySafeZone[] | undefined;
    let liveContextSource: string | null = null;

    if (wantsNearestSafeZone) {
      if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
        const locationReply = "I need access to your current location to find the nearest Kavach safe zone. Please allow location access in your browser and try again.";
        await appendMessage(userId, activeConversationId, { role: "user", content: normalizedMessage });
        await appendMessage(userId, activeConversationId, { role: "assistant", content: locationReply });
        return res.status(200).json({
          success: true,
          message: "Chatbot response",
          data: {
            conversationId: activeConversationId,
            message: locationReply,
            sources: [],
            suggestedActions: ["Enable location and retry"],
          },
        } satisfies ChatbotSuccessResponse);
      }

      const token = bearerTokenFromRequest(req);
      if (token) {
        try {
          nearbySafeZones = await fetchNearestSafeZones(token, location);
          liveContextSource = "Kavach live safety zones";
        } catch (error) {
          console.error("Safe-zone context lookup failed:", error);
          nearbySafeZones = undefined;
        }
      }
    }

    const groqMessages: GroqChatCompletionMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt({
          fileName,
          fileContent: content,
          location,
          context,
          nearbySafeZones,
        }),
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: normalizedMessage },
    ];

    const reply = await callGroq(groqMessages);
    const sources = [fileName, liveContextSource].filter((value): value is string => Boolean(value));

    await appendMessage(userId, activeConversationId, { role: "user", content: normalizedMessage });
    await appendMessage(userId, activeConversationId, { role: "assistant", content: reply }, sources);

    const body: ChatbotSuccessResponse = {
      success: true,
      message: "Chatbot response",
      data: {
        conversationId: activeConversationId,
        message: reply,
        sources,
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
