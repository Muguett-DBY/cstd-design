import { ensureSchema, json, login, logout, readJson, readSession, type PagesContext } from "../_shared/http";
import { LoginRequestSchema, parseRequest } from "../_shared/validation";

export async function onRequestGet({ request, env }: PagesContext) {
  const session = await readSession(request, env);
  return json({ authenticated: !!session, expiresAt: session?.expiresAt || null });
}

export async function onRequestPost({ request, env }: PagesContext) {
  await ensureSchema(env.DB);
  const parsed = parseRequest(LoginRequestSchema, await readJson(request));
  if (!parsed.ok) return json({ error: "请输入访问密码。" }, 400);
  return login(request, env, parsed.data.password);
}

export async function onRequestDelete({ request, env }: PagesContext) {
  return logout(request, env);
}
