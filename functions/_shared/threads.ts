import type { Env } from "./http";

export interface ThreadReplyRecord {
  id: string;
  conversationId: string;
  parentMessageId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function conversationExists(env: Env, conversationId: string) {
  const row = await env.DB.prepare(
    `SELECT id FROM conversations WHERE id = ?1 AND deleted_at IS NULL`,
  ).bind(conversationId).first<{ id: string }>();
  return !!row;
}

export async function parentMessageExists(env: Env, conversationId: string, parentMessageId: string) {
  const row = await env.DB.prepare(
    `SELECT id FROM messages WHERE id = ?1 AND conversation_id = ?2`,
  ).bind(parentMessageId, conversationId).first<{ id: string }>();
  return !!row;
}

export async function listThreadReplies(env: Env, conversationId: string) {
  const result = await env.DB.prepare(
    `SELECT mt.id, mt.conversation_id as conversationId, mt.parent_message_id as parentMessageId,
            mt.content, mt.created_at as createdAt, mt.updated_at as updatedAt
     FROM message_threads mt
     INNER JOIN conversations c ON c.id = mt.conversation_id
     WHERE mt.conversation_id = ?1 AND c.deleted_at IS NULL
     ORDER BY mt.created_at ASC`,
  ).bind(conversationId).all<ThreadReplyRecord>();
  return result.results || [];
}

export async function createThreadReply(
  env: Env,
  input: { conversationId: string; parentMessageId: string; content: string },
) {
  if (!await conversationExists(env, input.conversationId)) return null;
  if (!await parentMessageExists(env, input.conversationId, input.parentMessageId)) return null;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO message_threads (id, conversation_id, parent_message_id, content, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
  ).bind(id, input.conversationId, input.parentMessageId, input.content, now, now).run();

  return {
    id,
    conversationId: input.conversationId,
    parentMessageId: input.parentMessageId,
    content: input.content,
    createdAt: now,
    updatedAt: now,
  } satisfies ThreadReplyRecord;
}

export async function updateThreadReply(env: Env, id: string, content: string) {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE message_threads
     SET content = ?1, updated_at = ?2
     WHERE id = ?3
       AND conversation_id IN (SELECT id FROM conversations WHERE deleted_at IS NULL)`,
  ).bind(content, now, id).run();
  if (!result.meta.changes) return null;
  return env.DB.prepare(
    `SELECT id, conversation_id as conversationId, parent_message_id as parentMessageId,
            content, created_at as createdAt, updated_at as updatedAt
     FROM message_threads WHERE id = ?1`,
  ).bind(id).first<ThreadReplyRecord>();
}

export async function deleteThreadReply(env: Env, id: string) {
  const result = await env.DB.prepare(
    `DELETE FROM message_threads
     WHERE id = ?1
       AND conversation_id IN (SELECT id FROM conversations WHERE deleted_at IS NULL)`,
  ).bind(id).run();
  return Number(result.meta.changes || 0) > 0;
}

export async function clearMessageThread(env: Env, conversationId: string, parentMessageId: string) {
  if (!await conversationExists(env, conversationId)) return null;
  const result = await env.DB.prepare(
    `DELETE FROM message_threads WHERE conversation_id = ?1 AND parent_message_id = ?2`,
  ).bind(conversationId, parentMessageId).run();
  return Number(result.meta.changes || 0);
}
