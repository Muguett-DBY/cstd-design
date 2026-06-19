import { createBookmark, listBookmarks } from "../../../_shared/bookmarks";
import { badRequest, ensureSchema, json, readJson, requireSession, type PagesContext } from "../../../_shared/http";
import { parseRequest, CreateBookmarkSchema } from "../../../_shared/validation";

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const bookmarks = await listBookmarks(env, String(params.id));
  return json({ bookmarks });
}

export async function onRequestPost({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await ensureSchema(env.DB);
  const parsed = parseRequest(CreateBookmarkSchema, await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  const bookmark = await createBookmark(env, {
    conversationId: String(params.id),
    messageId: parsed.data.messageId,
  });
  return bookmark ? json({ bookmark }, 201) : json({ error: "消息不存在或已添加书签。" }, 404);
}
