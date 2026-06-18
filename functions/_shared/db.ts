import type { ChatMessageNode } from "./chat-tree";
import type { Env } from "./http";
import { sanitizeAssistantContent } from "./provider";

export async function createConversation(env: Env, title = "新会话") {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)`)
    .bind(id, title, now, now)
    .run();
  return { id, title, activeLeafId: null, createdAt: now, updatedAt: now };
}

export async function listConversations(env: Env, q = "") {
  const like = `%${q.trim()}%`;
  const query = q.trim()
    ? `SELECT DISTINCT c.id, c.title, c.active_leaf_id as activeLeafId, c.created_at as createdAt, c.updated_at as updatedAt
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
       WHERE c.deleted_at IS NULL AND (c.title LIKE ?1 OR m.content LIKE ?1)
       ORDER BY c.updated_at DESC LIMIT 100`
    : `SELECT id, title, active_leaf_id as activeLeafId, created_at as createdAt, updated_at as updatedAt
       FROM conversations WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 100`;
  const result = q.trim() ? await env.DB.prepare(query).bind(like).all() : await env.DB.prepare(query).all();
  return result.results || [];
}

export async function readConversation(env: Env, id: string) {
  const conversation = await env.DB.prepare(
    `SELECT id, title, active_leaf_id as activeLeafId, created_at as createdAt, updated_at as updatedAt
     FROM conversations WHERE id = ?1 AND deleted_at IS NULL`,
  )
    .bind(id)
    .first<{ id: string; title: string; activeLeafId: string | null; createdAt: string; updatedAt: string }>();
  if (!conversation) return null;
  const messages = await env.DB.prepare(
    `SELECT id, role, content, parent_id as parentId, status, created_at as createdAt, updated_at as updatedAt
     FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC`,
  )
    .bind(id)
    .all<ChatMessageNode>();
  return {
    ...conversation,
    messages: (messages.results || []).map((message) =>
      message.role === "assistant" ? { ...message, content: sanitizeAssistantContent(message.content) } : message,
    ),
  };
}

export async function renameConversation(env: Env, id: string, title: string) {
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE conversations SET title = ?1, updated_at = ?2 WHERE id = ?3 AND deleted_at IS NULL`).bind(title, now, id).run();
}

export async function setConversationActiveLeaf(env: Env, id: string, activeLeafId: string) {
  const leaf = await env.DB.prepare(
    `SELECT id FROM messages WHERE id = ?1 AND conversation_id = ?2 AND role = 'assistant'`,
  )
    .bind(activeLeafId, id)
    .first<{ id: string }>();
  if (!leaf) return false;
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE conversations SET active_leaf_id = ?1, updated_at = ?2 WHERE id = ?3 AND deleted_at IS NULL`)
    .bind(activeLeafId, now, id)
    .run();
  return true;
}

export async function softDeleteConversation(env: Env, id: string) {
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM message_threads WHERE conversation_id = ?1`).bind(id),
    env.DB.prepare(`UPDATE conversations SET deleted_at = ?1, updated_at = ?1 WHERE id = ?2`).bind(now, id),
  ]);
}

export async function insertMessage(
  env: Env,
  input: { conversationId: string; parentId?: string | null; role: "user" | "assistant"; content: string; status?: "complete" | "interrupted" | "streaming" },
) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO messages (id, conversation_id, parent_id, role, content, status, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
  )
    .bind(id, input.conversationId, input.parentId || null, input.role, input.content, input.status || "complete", now, now)
    .run();
  await env.DB.prepare(`UPDATE conversations SET active_leaf_id = ?1, updated_at = ?2 WHERE id = ?3`)
    .bind(id, now, input.conversationId)
    .run();
  return { id, createdAt: now };
}

export async function updateMessageContent(env: Env, id: string, content: string, status: "complete" | "interrupted" | "streaming") {
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE messages SET content = ?1, status = ?2, updated_at = ?3 WHERE id = ?4`).bind(content, status, now, id).run();
}

export function titleFromPrompt(prompt: string) {
  const clean = prompt.replace(/\s+/g, " ").trim();
  return clean.length > 24 ? `${clean.slice(0, 24)}...` : clean || "新会话";
}
