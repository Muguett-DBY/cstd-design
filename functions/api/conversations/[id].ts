import { readConversation, renameConversation, setConversationActiveLeaf, softDeleteConversation } from "../../_shared/db";
import { badRequest, json, readJson, requireSession, type PagesContext } from "../../_shared/http";
import { parseRequest, UpdateConversationSchema } from "../../_shared/validation";

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const conversation = await readConversation(env, String(params.id));
  return conversation ? json({ conversation }) : json({ error: "会话不存在。" }, 404);
}

export async function onRequestPatch({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const id = String(params.id);
  const parsed = parseRequest(UpdateConversationSchema, await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  const body = parsed.data;
  if (body.title !== undefined) {
    await renameConversation(env, id, body.title);
  }
  if (body.activeLeafId !== undefined) {
    const ok = await setConversationActiveLeaf(env, id, body.activeLeafId);
    if (!ok) return badRequest("分支不存在。");
  }
  if (body.title === undefined && body.activeLeafId === undefined) return badRequest("没有可更新的内容。");
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await softDeleteConversation(env, String(params.id));
  return json({ ok: true });
}
