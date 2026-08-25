import { ChatMessage } from "./types";

const MAX_HISTORY = 10;

// sessionId -> last N messages. In-memory only; resets on server restart.
const sessionHistory = new Map<string, ChatMessage[]>();

export function getHistory(sessionId: string): ChatMessage[] {
  return sessionHistory.get(sessionId) ?? [];
}

export function appendToHistory(sessionId: string, message: ChatMessage): void {
  const existing = sessionHistory.get(sessionId) ?? [];
  const updated = [...existing, message].slice(-MAX_HISTORY);
  sessionHistory.set(sessionId, updated);
}