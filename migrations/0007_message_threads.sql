CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  parent_message_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_message_threads_conversation
  ON message_threads (conversation_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_threads_parent
  ON message_threads (parent_message_id, created_at);
