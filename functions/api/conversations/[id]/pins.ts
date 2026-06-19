import { createPin, listPins } from "../../../../_shared/pins";
import { badRequest, ensureSchema, json, readJson, requireSession, type PagesContext } from "../../../../_shared/http";
import { parseRequest, CreatePinSchema } from "../../../../_shared/validation";

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const pins = await listPins(env, String(params.id));
  return json({ pins });
}

export async function onRequestPost({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await ensureSchema(env.DB);
  const parsed = parseRequest(CreatePinSchema, await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  const pin = await createPin(env, {
    conversationId: String(params.id),
    messageId: parsed.data.messageId,
  });
  return pin ? json({ pin }, 201) : json({ error: "消息不存在或已置顶。" }, 404);
}
