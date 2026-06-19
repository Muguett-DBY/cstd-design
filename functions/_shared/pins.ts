import type { Env } from "./http";

export interface PinRecord {
  id: string;
  messageId: string;
  conversationId: string;
  createdAt: string;
}

export async function createPin(env: Env, input: { messageId: string; conversationId: string }): Promise<{ status: "created" | "duplicate" | "not_found"; pin?: PinRecord }> {
  const msg = await env.DB.prepare(`SELECT id FROM messages WHERE id = ?1 AND conversation_id = ?2`)
    .bind(input.messageId, input.conversationId)
    .first<{ id: string }>();
  if (!msg) return { status: "not_found" };

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO pins (id, message_id, conversation_id, created_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(message_id, conversation_id) DO NOTHING`
  )
    .bind(id, input.messageId, input.conversationId, createdAt)
    .run();

  if ((result.meta?.changes ?? 0) === 0) return { status: "duplicate" };
  return { status: "created", pin: { id, messageId: input.messageId, conversationId: input.conversationId, createdAt } };
}

export async function listPins(env: Env, conversationId: string): Promise<PinRecord[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, message_id as messageId, conversation_id as conversationId, created_at as createdAt
     FROM pins WHERE conversation_id = ?1 ORDER BY created_at DESC`
  )
    .bind(conversationId)
    .all<PinRecord>();
  return results || [];
}

export async function deletePin(env: Env, id: string): Promise<boolean> {
  const result = await env.DB.prepare(`DELETE FROM pins WHERE id = ?1`).bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function deletePinsByConversation(env: Env, conversationId: string): Promise<number> {
  const result = await env.DB.prepare(`DELETE FROM pins WHERE conversation_id = ?1`).bind(conversationId).run();
  return result.meta?.changes ?? 0;
}
