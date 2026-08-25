import { ChatMessage } from "./types.js";

const sessionHistory = new Map<string, ChatMessage[]>();

function maxHistory(): number {
  const parsed = Number(process.env.CHATBOT_MAX_HISTORY || 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 50) : 10;
}

export function getHistory(sessionId: string): ChatMessage[] {
  return sessionHistory.get(sessionId) ?? [];
}

export function appendToHistory(sessionId: string, message: ChatMessage): void {
  const existing = sessionHistory.get(sessionId) ?? [];
  sessionHistory.set(sessionId, [...existing, message].slice(-maxHistory()));
}
