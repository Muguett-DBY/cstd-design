import { deletePin } from "../../_shared/pins";
import { badRequest, json, requireSession, type PagesContext } from "../../_shared/http";
import { z } from "zod";

const UUID_PARAM = z.string().uuid();

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const parsed = UUID_PARAM.safeParse(params.id);
  if (!parsed.success) return badRequest("无效的置顶 ID。");
  const deleted = await deletePin(env, parsed.data);
  return deleted ? json({ ok: true }) : json({ error: "置顶不存在。" }, 404);
}
