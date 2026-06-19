CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(message_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_conversation ON bookmarks (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_message ON bookmarks (message_id);

CREATE TABLE IF NOT EXISTS pins (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(message_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_pins_conversation ON pins (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pins_message ON pins (message_id);
