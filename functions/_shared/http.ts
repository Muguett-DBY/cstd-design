import { clearSessionCookie, createSessionCookie, hashClientFingerprint, hashSessionToken, isThrottleAllowed, nextThrottleState, parseSessionCookie, randomBase64Url, verifyPasswordHash } from "./security";

export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  AGNES_API_KEY: string;
  APP_PASSWORD_HASH: string;
  SESSION_SECRET: string;
  LOGIN_HASH_SECRET: string;
  ASSET_CAPABILITY_SECRET: string;
}

export type PagesContext = EventContext<Env, string, Record<string, string>>;

export const SESSION_TTL_MS = 31_536_000_000;

export function json(value: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

export function badRequest(message = "请求无效。") {
  return json({ error: message }, 400);
}

export function unauthorized() {
  return json({ error: "请先登录。" }, 401);
}

export async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (
      fingerprint TEXT PRIMARY KEY,
      failures INTEGER NOT NULL,
      allowed_at INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      active_leaf_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      parent_id TEXT,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('complete', 'interrupted', 'streaming')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('upload', 'image', 'video')),
      media_type TEXT NOT NULL,
      object_key TEXT NOT NULL,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS video_tasks (
      id TEXT PRIMARY KEY,
      provider_task_id TEXT NOT NULL,
      status TEXT NOT NULL,
      asset_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
  ]);
}

export async function login(request: Request, env: Env, password: string) {
  await ensureSchema(env.DB);
  const now = Date.now();
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const fingerprint = await hashClientFingerprint(ip, env.LOGIN_HASH_SECRET || env.SESSION_SECRET);
  const throttle = await env.DB.prepare(`SELECT fingerprint, failures, allowed_at as allowedAt FROM login_attempts WHERE fingerprint = ?1`)
    .bind(fingerprint)
    .first<{ fingerprint: string; failures: number; allowedAt: number }>();

  if (!isThrottleAllowed(throttle, now)) {
    return json({ error: "登录尝试过多，请稍后再试。" }, 429);
  }

  const ok = await verifyPasswordHash(password, env.APP_PASSWORD_HASH);
  if (!ok) {
    const next = nextThrottleState(throttle, now, fingerprint);
    await env.DB.prepare(
      `INSERT INTO login_attempts (fingerprint, failures, allowed_at, updated_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(fingerprint) DO UPDATE SET failures = excluded.failures, allowed_at = excluded.allowed_at, updated_at = excluded.updated_at`,
    )
      .bind(next.fingerprint, next.failures, next.allowedAt, new Date(now).toISOString())
      .run();
    return json({ error: "密码不正确。" }, 401);
  }

  await env.DB.prepare(`DELETE FROM login_attempts WHERE fingerprint = ?1`).bind(fingerprint).run();
  const sessionId = randomBase64Url(18);
  const token = randomBase64Url(32);
  const nowIso = new Date(now).toISOString();
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();
  await env.DB.prepare(`INSERT INTO auth_sessions (id, token_hash, created_at, expires_at, last_seen_at) VALUES (?1, ?2, ?3, ?4, ?5)`)
    .bind(sessionId, await hashSessionToken(token), nowIso, expiresAt, nowIso)
    .run();

  return json({ authenticated: true, expiresAt }, 200, { "Set-Cookie": createSessionCookie(sessionId, token, true) });
}

export async function readSession(request: Request, env: Env) {
  await ensureSchema(env.DB);
  const parsed = parseSessionCookie(request.headers.get("cookie"));
  if (!parsed) return null;
  const tokenHash = await hashSessionToken(parsed.token);
  const row = await env.DB.prepare(`SELECT id, token_hash, expires_at FROM auth_sessions WHERE id = ?1`).bind(parsed.sessionId).first<{
    id: string;
    token_hash: string;
    expires_at: string;
  }>();
  if (!row || row.token_hash !== tokenHash) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await env.DB.prepare(`DELETE FROM auth_sessions WHERE id = ?1`).bind(row.id).run();
    return null;
  }
  await env.DB.prepare(`UPDATE auth_sessions SET last_seen_at = ?1 WHERE id = ?2`).bind(new Date().toISOString(), row.id).run();
  return { sessionId: row.id, expiresAt: row.expires_at };
}

export async function requireSession(request: Request, env: Env) {
  const session = await readSession(request, env);
  if (!session) return { session: null, response: unauthorized() };
  return { session, response: null };
}

export async function logout(request: Request, env: Env) {
  await ensureSchema(env.DB);
  const parsed = parseSessionCookie(request.headers.get("cookie"));
  if (parsed) await env.DB.prepare(`DELETE FROM auth_sessions WHERE id = ?1`).bind(parsed.sessionId).run();
  return json({ authenticated: false }, 200, { "Set-Cookie": clearSessionCookie(true) });
}

export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function getExtension(filename: string, contentType: string) {
  const fromName = filename.split(".").pop();
  if (fromName && /^[a-z0-9]{2,5}$/i.test(fromName)) return fromName.toLowerCase();
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  if (contentType === "video/mp4") return "mp4";
  return "bin";
}

export async function assetById(env: Env, id: string) {
  return env.DB.prepare(`SELECT id, kind, media_type, object_key, filename, size, created_at FROM assets WHERE id = ?1`).bind(id).first<{
    id: string;
    kind: "upload" | "image" | "video";
    media_type: string;
    object_key: string;
    filename: string;
    size: number;
    created_at: string;
  }>();
}
