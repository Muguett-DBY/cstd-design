import { addReaction, listReactions } from "../../../_shared/reactions";
import { badRequest, ensureSchema, json, readJson, requireSession, type PagesContext } from "../../../_shared/http";
import { z } from "zod";

const UUID_PARAM = z.string().uuid();
const ReactionSchema = z.object({ messageId: z.string().uuid(), emoji: z.string().min(1).max(10) }).strict();

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const parsed = UUID_PARAM.safeParse(params.id);
  if (!parsed.success) return badRequest("无效的会话 ID。");
  const reactions = await listReactions(env, parsed.data);
  return json({ reactions });
}

export async function onRequestPost({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await ensureSchema(env.DB);
  const paramParsed = UUID_PARAM.safeParse(params.id);
  if (!paramParsed.success) return badRequest("无效的会话 ID。");
  const parsed = ReactionSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("请求参数无效。");
  const result = await addReaction(env, {
    conversationId: paramParsed.data,
    messageId: parsed.data.messageId,
    emoji: parsed.data.emoji,
  });
  if (result.status === "not_found") return json({ error: "消息不存在。" }, 404);
  return json({ status: result.status });
}
