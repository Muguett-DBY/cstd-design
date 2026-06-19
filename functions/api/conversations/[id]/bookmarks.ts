import { createBookmark, listBookmarks } from "../../../_shared/bookmarks";
import { badRequest, ensureSchema, json, readJson, requireSession, type PagesContext } from "../../../_shared/http";
import { parseRequest, CreateBookmarkSchema } from "../../../_shared/validation";
import { z } from "zod";

const UUID_PARAM = z.string().uuid();

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const parsed = UUID_PARAM.safeParse(params.id);
  if (!parsed.success) return badRequest("无效的会话 ID。");
  const bookmarks = await listBookmarks(env, parsed.data);
  return json({ bookmarks });
}

export async function onRequestPost({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await ensureSchema(env.DB);
  const paramParsed = UUID_PARAM.safeParse(params.id);
  if (!paramParsed.success) return badRequest("无效的会话 ID。");
  const parsed = parseRequest(CreateBookmarkSchema, await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  const result = await createBookmark(env, {
    conversationId: paramParsed.data,
    messageId: parsed.data.messageId,
  });
  if (result.status === "not_found") return json({ error: "消息不存在。" }, 404);
  if (result.status === "duplicate") return json({ error: "已添加书签。" }, 409);
  return json({ bookmark: result.bookmark }, 201);
}
