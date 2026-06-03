import { createConversation, listConversations } from "../_shared/db";
import { ensureSchema, json, readJson, requireSession, type PagesContext } from "../_shared/http";
import { CreateConversationSchema, parseRequest } from "../_shared/validation";

export async function onRequestGet({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  return json({ conversations: await listConversations(env, url.searchParams.get("q") || "") });
}

export async function onRequestPost({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await ensureSchema(env.DB);
  const parsed = parseRequest(CreateConversationSchema, await readJson(request));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  return json({ conversation: await createConversation(env, parsed.data.title || "新会话") }, 201);
}
