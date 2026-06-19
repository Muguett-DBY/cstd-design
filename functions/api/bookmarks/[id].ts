import { deleteBookmark } from "../../_shared/bookmarks";
import { badRequest, json, requireSession, type PagesContext } from "../../_shared/http";
import { z } from "zod";

const UUID_PARAM = z.string().uuid();

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const parsed = UUID_PARAM.safeParse(params.id);
  if (!parsed.success) return badRequest("无效的书签 ID。");
  const deleted = await deleteBookmark(env, parsed.data);
  return deleted ? json({ ok: true }) : json({ error: "书签不存在。" }, 404);
}
