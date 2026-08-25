export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestBody {
  sessionId: string;
  message: string;
}

export interface ChatResponseBody {
  reply: string;
  sourceFile: string | null;
}

export interface KnowledgeFileScore {
  fileName: string;
  score: number;
}

export interface GroqChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}
