const PASSWORD_ALGORITHM = "pbkdf2-sha256";
const DEFAULT_PASSWORD_ITERATIONS = 100_000;
const SESSION_TTL_SECONDS = 31_536_000;
const COOKIE_NAME = "cstd_design_session";

export interface ThrottleState {
  fingerprint: string;
  failures: number;
  allowedAt: number;
}

export async function createPasswordHash(password: string, salt = randomBase64Url(16), iterations = DEFAULT_PASSWORD_ITERATIONS) {
  const derived = await pbkdf2(password, salt, iterations);
  return `${PASSWORD_ALGORITHM}$${iterations}$${salt}$${base64UrlEncodeBytes(derived)}`;
}

export async function verifyPasswordHash(password: string, stored: string) {
  const [algorithm, iterationsText, salt, expected] = stored.split("$");
  const iterations = Number(iterationsText);
  if (algorithm !== PASSWORD_ALGORITHM || !Number.isInteger(iterations) || iterations < 100_000 || iterations > 2_000_000) {
    return false;
  }
  if (!salt || !expected) return false;
  const actual = base64UrlEncodeBytes(await pbkdf2(password, salt, iterations));
  return timingSafeEqual(actual, expected);
}

export function createSessionCookie(sessionId: string, token: string, secure = true) {
  return `${COOKIE_NAME}=${sessionId}.${token}; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(secure = true) {
  return `${COOKIE_NAME}=; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Max-Age=0`;
}

export function parseSessionCookie(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return null;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  const value = cookie.slice(COOKIE_NAME.length + 1);
  const [sessionId, token] = value.split(".");
  if (!sessionId || !token) return null;
  return { sessionId, token };
}

export async function hashSessionToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return base64UrlEncodeBytes(new Uint8Array(digest));
}

export async function hashClientFingerprint(clientAddress: string, secret: string) {
  return hmacSha256Base64Url(secret, `login:${clientAddress}`);
}

export function nextThrottleState(current: ThrottleState | null, nowMs: number, fingerprint: string): ThrottleState {
  const failures = current?.fingerprint === fingerprint ? current.failures + 1 : 1;
  const delayMs = failures <= 1 ? 0 : Math.min(15 * 60_000, 2 ** Math.min(failures - 2, 6) * 30_000);
  return { fingerprint, failures, allowedAt: nowMs + delayMs };
}

export function isThrottleAllowed(state: ThrottleState | null, nowMs: number) {
  return !state || state.allowedAt <= nowMs;
}

export function randomBase64Url(byteLength = 24) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncodeBytes(bytes);
}

export function timingSafeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }
  return diff === 0;
}

export async function hmacSha256Base64Url(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

export function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function pbkdf2(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}
