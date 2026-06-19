import type { Env } from "./http";

export interface EditRecord {
  id: string;
  messageId: string;
  conversationId: string;
  originalContent: string;
  editedContent: string;
  createdAt: string;
}

export async function createEdit(env: Env, input: { messageId: string; conversationId: string; originalContent: string; editedContent: string }): Promise<EditRecord | null> {
  const msg = await env.DB.prepare(`SELECT id FROM messages WHERE id = ?1 AND conversation_id = ?2`)
    .bind(input.messageId, input.conversationId)
    .first<{ id: string }>();
  if (!msg) return null;

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO message_edits (id, message_id, conversation_id, original_content, edited_content, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  )
    .bind(id, input.messageId, input.conversationId, input.originalContent, input.editedContent, createdAt)
    .run();
  return { id, messageId: input.messageId, conversationId: input.conversationId, originalContent: input.originalContent, editedContent: input.editedContent, createdAt };
}

export async function listEdits(env: Env, messageId: string): Promise<EditRecord[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, message_id as messageId, conversation_id as conversationId, original_content as originalContent, edited_content as editedContent, created_at as createdAt
     FROM message_edits WHERE message_id = ?1 ORDER BY created_at ASC`
  )
    .bind(messageId)
    .all<EditRecord>();
  return results || [];
}

export async function listEditsByConversation(env: Env, conversationId: string): Promise<Record<string, EditRecord[]>> {
  const { results } = await env.DB.prepare(
    `SELECT id, message_id as messageId, conversation_id as conversationId, original_content as originalContent, edited_content as editedContent, created_at as createdAt
     FROM message_edits WHERE conversation_id = ?1 ORDER BY created_at ASC`
  )
    .bind(conversationId)
    .all<EditRecord>();

  const edits: Record<string, EditRecord[]> = {};
  for (const e of results || []) {
    if (!edits[e.messageId]) edits[e.messageId] = [];
    edits[e.messageId].push(e);
  }
  return edits;
}

export async function deleteEditsByConversation(env: Env, conversationId: string): Promise<number> {
  const result = await env.DB.prepare(`DELETE FROM message_edits WHERE conversation_id = ?1`).bind(conversationId).run();
  return result.meta?.changes ?? 0;
}
