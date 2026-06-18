import {
  clearMessageThread,
  conversationExists,
  createThreadReply,
  listThreadReplies,
} from "../../../_shared/threads";
import { badRequest, ensureSchema, json, readJson, requireSession, type PagesContext } from "../../../_shared/http";
import { CreateThreadReplySchema, parseRequest } from "../../../_shared/validation";

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const conversationId = String(params.id);
  if (!await conversationExists(env, conversationId)) return json({ error: "会话不存在。" }, 404);
  return json({ replies: await listThreadReplies(env, conversationId) });
}

export async function onRequestPost({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await ensureSchema(env.DB);
  const parsed = parseRequest(CreateThreadReplySchema, await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  const reply = await createThreadReply(env, {
    conversationId: String(params.id),
    parentMessageId: parsed.data.parentMessageId,
    content: parsed.data.content,
  });
  return reply ? json({ reply }, 201) : json({ error: "会话或父消息不存在。" }, 404);
}

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const parentMessageId = new URL(request.url).searchParams.get("parentMessageId");
  if (!parentMessageId) return badRequest("缺少父消息。");
  const deleted = await clearMessageThread(env, String(params.id), parentMessageId);
  return deleted === null ? json({ error: "会话不存在。" }, 404) : json({ ok: true, deleted });
}
