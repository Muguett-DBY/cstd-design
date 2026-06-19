import { deletePin } from "../../_shared/pins";
import { json, requireSession, type PagesContext } from "../../_shared/http";

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const deleted = await deletePin(env, String(params.id));
  return deleted ? json({ ok: true }) : json({ error: "置顶不存在。" }, 404);
}
