import { json, requireSession, upstreamApiKey, type Env, type PagesContext } from "../_shared/http";
import { buildServiceReadiness } from "../_shared/readiness";

function hasConfiguredSecrets(env: Env, keys: (keyof Env)[]) {
  return keys.every((key) => typeof env[key] === "string" && String(env[key]).trim().length > 0);
}

async function databaseIsReachable(env: Env) {
  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    return row?.ok === 1;
  } catch {
    return false;
  }
}

async function mediaStorageIsReachable(env: Env) {
  try {
    await env.MEDIA_BUCKET.list({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function onRequestGet({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;

  const [databaseReachable, mediaStorageReachable] = await Promise.all([
    databaseIsReachable(env),
    mediaStorageIsReachable(env),
  ]);

  return json(buildServiceReadiness({
    databaseReachable,
    mediaStorageReachable,
    generationConfigured: upstreamApiKey(env).trim().length > 0,
    securityConfigured: hasConfiguredSecrets(env, [
      "APP_PASSWORD_HASH",
      "SESSION_SECRET",
      "LOGIN_HASH_SECRET",
      "ASSET_CAPABILITY_SECRET",
    ]),
    checkedAt: new Date().toISOString(),
  }));
}
