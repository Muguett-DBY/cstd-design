import type { Env } from "./http";

export interface BookmarkRecord {
  id: string;
  messageId: string;
  conversationId: string;
  createdAt: string;
}

export async function createBookmark(env: Env, input: { messageId: string; conversationId: string }): Promise<{ status: "created" | "duplicate" | "not_found"; bookmark?: BookmarkRecord }> {
  const msg = await env.DB.prepare(`SELECT id FROM messages WHERE id = ?1 AND conversation_id = ?2`)
    .bind(input.messageId, input.conversationId)
    .first<{ id: string }>();
  if (!msg) return { status: "not_found" };

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO bookmarks (id, message_id, conversation_id, created_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(message_id, conversation_id) DO NOTHING`
  )
    .bind(id, input.messageId, input.conversationId, createdAt)
    .run();

  if ((result.meta?.changes ?? 0) === 0) return { status: "duplicate" };
  return { status: "created", bookmark: { id, messageId: input.messageId, conversationId: input.conversationId, createdAt } };
}

export async function listBookmarks(env: Env, conversationId: string): Promise<BookmarkRecord[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, message_id as messageId, conversation_id as conversationId, created_at as createdAt
     FROM bookmarks WHERE conversation_id = ?1 ORDER BY created_at DESC`
  )
    .bind(conversationId)
    .all<BookmarkRecord>();
  return results || [];
}

export async function deleteBookmark(env: Env, id: string): Promise<boolean> {
  const result = await env.DB.prepare(`DELETE FROM bookmarks WHERE id = ?1`).bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function deleteBookmarksByConversation(env: Env, conversationId: string): Promise<number> {
  const result = await env.DB.prepare(`DELETE FROM bookmarks WHERE conversation_id = ?1`).bind(conversationId).run();
  return result.meta?.changes ?? 0;
}
