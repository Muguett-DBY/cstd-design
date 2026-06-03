CREATE TABLE IF NOT EXISTS api_rate_limits (
  fingerprint TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
