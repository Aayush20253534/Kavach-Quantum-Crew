import { randomUUID } from "node:crypto";
import { pool } from "./db.js";
import { ChatMessage } from "./types.js";

function maxHistory(): number {
  const parsed = Number(process.env.CHATBOT_MAX_HISTORY || 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 50) : 10;
}

export async function ensureConversation(userId: string, conversationId?: string | null): Promise<string> {
  if (conversationId) {
    const existing = await pool.query(
      "SELECT id FROM ai_chat_conversations WHERE id = $1 AND user_id = $2",
      [conversationId, userId],
    );
    if (existing.rowCount) return conversationId;
  }

  const id = randomUUID();
  await pool.query(
    "INSERT INTO ai_chat_conversations (id, user_id) VALUES ($1, $2)",
    [id, userId],
  );
  return id;
}

export async function getConversationHistory(userId: string, conversationId: string): Promise<ChatMessage[]> {
  const result = await pool.query(
    `SELECT role, content
       FROM ai_chat_messages
      WHERE user_id = $1
        AND conversation_id = $2
        AND created_at > COALESCE((SELECT hidden_before FROM ai_chat_view_state WHERE user_id = $1), '-infinity'::timestamptz)
      ORDER BY created_at DESC
      LIMIT $3`,
    [userId, conversationId, maxHistory()],
  );

  return result.rows.reverse().map((row) => ({ role: row.role, content: row.content }));
}

export async function appendMessage(
  userId: string,
  conversationId: string,
  message: ChatMessage,
  sources: string[] = [],
): Promise<void> {
  await pool.query(
    `INSERT INTO ai_chat_messages (conversation_id, user_id, role, content, sources)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [conversationId, userId, message.role, message.content, JSON.stringify(sources)],
  );
  await pool.query(
    "UPDATE ai_chat_conversations SET updated_at = now() WHERE id = $1 AND user_id = $2",
    [conversationId, userId],
  );
}

export async function getVisibleHistory(userId: string) {
  const result = await pool.query(
    `SELECT m.id, m.conversation_id, m.role, m.content, m.sources, m.created_at
       FROM ai_chat_messages m
      WHERE m.user_id = $1
        AND m.created_at > COALESCE((SELECT hidden_before FROM ai_chat_view_state WHERE user_id = $1), '-infinity'::timestamptz)
      ORDER BY m.created_at ASC`,
    [userId],
  );

  const conversationId = result.rows.length ? result.rows[result.rows.length - 1].conversation_id : null;
  return {
    conversationId,
    messages: result.rows.map((row) => ({
      id: String(row.id),
      conversationId: row.conversation_id,
      sender: row.role === "assistant" ? "ai" : "user",
      text: row.content,
      sources: row.sources ?? [],
      createdAt: row.created_at,
    })),
  };
}

export async function hideHistoryForUser(userId: string): Promise<void> {
  await pool.query(
    `INSERT INTO ai_chat_view_state (user_id, hidden_before, updated_at)
     VALUES ($1, now(), now())
     ON CONFLICT (user_id)
     DO UPDATE SET hidden_before = now(), updated_at = now()`,
    [userId],
  );
}
