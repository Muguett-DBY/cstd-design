CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations (deleted_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_assets_kind_created ON assets (kind, created_at);
CREATE INDEX IF NOT EXISTS idx_video_tasks_active ON video_tasks (asset_id, status, created_at);
