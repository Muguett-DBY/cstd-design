import { createPin, listPins } from "../../../_shared/pins";
import { badRequest, ensureSchema, json, readJson, requireSession, type PagesContext } from "../../../_shared/http";
import { parseRequest, CreatePinSchema } from "../../../_shared/validation";
import { z } from "zod";

const UUID_PARAM = z.string().uuid();

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const parsed = UUID_PARAM.safeParse(params.id);
  if (!parsed.success) return badRequest("无效的会话 ID。");
  const pins = await listPins(env, parsed.data);
  return json({ pins });
}

export async function onRequestPost({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await ensureSchema(env.DB);
  const paramParsed = UUID_PARAM.safeParse(params.id);
  if (!paramParsed.success) return badRequest("无效的会话 ID。");
  const parsed = parseRequest(CreatePinSchema, await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  const result = await createPin(env, {
    conversationId: paramParsed.data,
    messageId: parsed.data.messageId,
  });
  if (result.status === "not_found") return json({ error: "消息不存在。" }, 404);
  if (result.status === "duplicate") return json({ error: "已置顶。" }, 409);
  return json({ pin: result.pin }, 201);
}
