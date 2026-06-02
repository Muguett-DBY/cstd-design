import { createConversation, listConversations } from "../_shared/db";
import { ensureSchema, json, readJson, requireSession, type PagesContext } from "../_shared/http";

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
  const body = await readJson<{ title?: string }>(request);
  return json({ conversation: await createConversation(env, body?.title || "新会话") }, 201);
}
