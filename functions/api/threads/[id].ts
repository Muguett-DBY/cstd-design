import { deleteThreadReply, updateThreadReply } from "../../_shared/threads";
import { badRequest, json, readJson, requireSession, type PagesContext } from "../../_shared/http";
import { parseRequest, UpdateThreadReplySchema } from "../../_shared/validation";

export async function onRequestPatch({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const parsed = parseRequest(UpdateThreadReplySchema, await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  const reply = await updateThreadReply(env, String(params.id), parsed.data.content);
  return reply ? json({ reply }) : json({ error: "回复不存在。" }, 404);
}

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const deleted = await deleteThreadReply(env, String(params.id));
  return deleted ? json({ ok: true }) : json({ error: "回复不存在。" }, 404);
}
