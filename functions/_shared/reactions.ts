import type { Env } from "./http";

export interface ReactionRecord {
  id: string;
  messageId: string;
  conversationId: string;
  emoji: string;
  createdAt: string;
}

export async function addReaction(env: Env, input: { messageId: string; conversationId: string; emoji: string }): Promise<{ status: "added" | "removed" | "not_found" }> {
  const msg = await env.DB.prepare(`SELECT id FROM messages WHERE id = ?1 AND conversation_id = ?2`)
    .bind(input.messageId, input.conversationId)
    .first<{ id: string }>();
  if (!msg) return { status: "not_found" };

  const existing = await env.DB.prepare(`SELECT id FROM reactions WHERE message_id = ?1 AND emoji = ?2`)
    .bind(input.messageId, input.emoji)
    .first<{ id: string }>();

  if (existing) {
    await env.DB.prepare(`DELETE FROM reactions WHERE id = ?1`).bind(existing.id).run();
    return { status: "removed" };
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO reactions (id, message_id, conversation_id, emoji, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(message_id, emoji) DO NOTHING`
  )
    .bind(id, input.messageId, input.conversationId, input.emoji, createdAt)
    .run();
  return { status: "added" };
}

export async function listReactions(env: Env, conversationId: string): Promise<Record<string, string[]>> {
  const { results } = await env.DB.prepare(
    `SELECT message_id as messageId, emoji FROM reactions WHERE conversation_id = ?1 ORDER BY created_at DESC`
  )
    .bind(conversationId)
    .all<{ messageId: string; emoji: string }>();

  const reactions: Record<string, string[]> = {};
  for (const r of results || []) {
    if (!reactions[r.messageId]) reactions[r.messageId] = [];
    if (!reactions[r.messageId].includes(r.emoji)) reactions[r.messageId].push(r.emoji);
  }
  return reactions;
}

export async function deleteReactionsByConversation(env: Env, conversationId: string): Promise<number> {
  const result = await env.DB.prepare(`DELETE FROM reactions WHERE conversation_id = ?1`).bind(conversationId).run();
  return result.meta?.changes ?? 0;
}
