import { readConversation, renameConversation, setConversationActiveLeaf, softDeleteConversation } from "../../_shared/db";
import { badRequest, json, readJson, requireSession, type PagesContext } from "../../_shared/http";

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
  const body = await readJson<{ title?: string; activeLeafId?: string }>(request);
  const title = body?.title?.trim();
  if (body?.title !== undefined) {
    if (!title) return badRequest("标题不能为空。");
    await renameConversation(env, id, title);
  }
  if (body?.activeLeafId !== undefined) {
    const ok = await setConversationActiveLeaf(env, id, body.activeLeafId);
    if (!ok) return badRequest("分支不存在。");
  }
  if (body?.title === undefined && body?.activeLeafId === undefined) return badRequest("没有可更新的内容。");
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await softDeleteConversation(env, String(params.id));
  return json({ ok: true });
}
