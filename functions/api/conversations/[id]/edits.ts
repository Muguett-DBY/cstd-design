import { createEdit, listEditsByConversation } from "../../../../_shared/edits";
import { badRequest, ensureSchema, json, readJson, requireSession, type PagesContext } from "../../../../_shared/http";
import { z } from "zod";

const UUID_PARAM = z.string().uuid();
const EditSchema = z.object({
  messageId: z.string().uuid(),
  originalContent: z.string().min(1).max(10000),
  editedContent: z.string().min(1).max(10000),
}).strict();

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const parsed = UUID_PARAM.safeParse(params.id);
  if (!parsed.success) return badRequest("无效的会话 ID。");
  const edits = await listEditsByConversation(env, parsed.data);
  return json({ edits });
}

export async function onRequestPost({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await ensureSchema(env.DB);
  const paramParsed = UUID_PARAM.safeParse(params.id);
  if (!paramParsed.success) return badRequest("无效的会话 ID。");
  const parsed = EditSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("请求参数无效。");
  const edit = await createEdit(env, {
    conversationId: paramParsed.data,
    messageId: parsed.data.messageId,
    originalContent: parsed.data.originalContent,
    editedContent: parsed.data.editedContent,
  });
  return edit ? json({ edit }, 201) : json({ error: "消息不存在。" }, 404);
}
