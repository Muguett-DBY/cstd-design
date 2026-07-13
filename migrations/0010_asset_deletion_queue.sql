CREATE TABLE IF NOT EXISTS asset_deletion_queue (
  object_key TEXT PRIMARY KEY,
  queued_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_asset_deletion_queue_retry
  ON asset_deletion_queue (next_attempt_at, queued_at);
