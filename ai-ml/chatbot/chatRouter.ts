import { Router, Request, Response } from "express";
import { ChatRequestBody, ChatResponseBody, GroqChatCompletionMessage } from "./types";
import { selectBestKbFile } from "./kbSelector";
import { getHistory, appendToHistory } from "./memoryStore";
import { callGroq } from "./groqClient";

const router = Router();

function buildSystemPrompt(fileName: string, fileContent: string): string {
  return [
    "You are a helpful support assistant for this website.",
    "Answer the user's question using ONLY the information in the document below.",
    "If the document does not contain the answer, say you don't have enough information — do not make things up.",
    "",
    `--- Document: ${fileName} ---`,
    fileContent,
    "--- End of document ---",
  ].join("\n");
}

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body as Partial<ChatRequestBody>;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const { fileName, content } = selectBestKbFile(message);

    if (!fileName || !content) {
      const fallbackReply =
        "I couldn't find relevant information in the knowledge base to answer that question.";

      appendToHistory(sessionId, { role: "user", content: message });
      appendToHistory(sessionId, { role: "assistant", content: fallbackReply });

      const body: ChatResponseBody = { reply: fallbackReply, sourceFile: null };
      return res.status(200).json(body);
    }

    const history = getHistory(sessionId);

    const groqMessages: GroqChatCompletionMessage[] = [
      { role: "system", content: buildSystemPrompt(fileName, content) },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const reply = await callGroq(groqMessages);

    appendToHistory(sessionId, { role: "user", content: message });
    appendToHistory(sessionId, { role: "assistant", content: reply });

    const body: ChatResponseBody = { reply, sourceFile: fileName };
    return res.status(200).json(body);
  } catch (err) {
    console.error("Chat router error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: "Internal server error", details: errorMessage });
  }
});

export default router;
