CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_chat_conversations_user_updated_idx ON ai_chat_conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id bigserial PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role varchar(16) NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_chat_messages_user_created_idx ON ai_chat_messages (user_id, created_at ASC);
CREATE INDEX IF NOT EXISTS ai_chat_messages_conversation_created_idx ON ai_chat_messages (conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS ai_chat_view_state (
  user_id uuid PRIMARY KEY,
  hidden_before timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
