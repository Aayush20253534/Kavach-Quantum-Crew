export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
}

export interface ChatbotRequestBody {
  message: string;
  conversationId: string | null;
  location?: LocationPayload;
  context?: Record<string, unknown>;
}

export interface ChatbotResponseData {
  conversationId: string;
  message: string;
  sources: string[];
  suggestedActions: string[];
}

export interface ChatbotSuccessResponse {
  success: true;
  message: string;
  data: ChatbotResponseData;
}

export interface ChatbotErrorResponse {
  success: false;
  message: string;
  code?: string;
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