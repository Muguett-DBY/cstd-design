CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  fingerprint TEXT PRIMARY KEY,
  failures INTEGER NOT NULL,
  allowed_at INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  active_leaf_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  parent_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('complete', 'interrupted', 'streaming')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('upload', 'image', 'video')),
  media_type TEXT NOT NULL,
  object_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS video_tasks (
  id TEXT PRIMARY KEY,
  provider_task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  asset_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
