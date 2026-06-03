import { hmacSha256Base64Url, timingSafeEqual } from "./security";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "video/mp4"]);
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024;

export interface UploadCandidate {
  name: string;
  type: string;
  size: number;
}

export function validateUpload(files: UploadCandidate[], options: { maxCount: number; maxSize?: number }) {
  if (files.length > options.maxCount) return { ok: false as const, error: `最多只能上传 ${options.maxCount} 张参考图。` };
  for (const file of files) {
    if (!ALLOWED_TYPES.has(safeMediaType(file.type, ""))) return { ok: false as const, error: "只支持 PNG、JPEG、WebP 或 MP4 文件。" };
    if (file.size > (options.maxSize ?? DEFAULT_MAX_SIZE)) return { ok: false as const, error: "文件过大，请压缩后再上传。" };
  }
  return { ok: true as const };
}

export async function validateUploadContents(files: File[]) {
  for (const file of files) {
    const declared = safeMediaType(file.type, "");
    const detected = await detectMediaType(file);
    if (!declared || !detected || declared !== detected) {
      return { ok: false as const, error: "文件内容与类型不匹配，请重新选择 PNG、JPEG、WebP 或 MP4 文件。" };
    }
  }
  return { ok: true as const };
}

export function safeMediaType(value: string | null | undefined, fallback = "application/octet-stream") {
  const normalized = String(value || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  return ALLOWED_TYPES.has(normalized) ? normalized : fallback;
}

export function sanitizeFilename(name: string, fallback = "asset.bin") {
  const base = Array.from(name.split(/[/\\]/).pop() || fallback)
    .map((char) => (isUnsafeFilenameChar(char) ? "_" : char))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return (base || fallback).slice(0, 160);
}

export function publicFilename(name: string, fallback = "asset.bin") {
  return sanitizeFilename(name, fallback).replace(/naihuangbao/gi, "asset").replace(/奶黄包/g, "asset");
}

export function contentDisposition(filename: string, download: boolean) {
  if (!download) return "inline";
  const safe = publicFilename(filename);
  const ascii = safe.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

async function detectMediaType(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && text(bytes, 0, 4) === "RIFF" && text(bytes, 8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && text(bytes, 4, 8) === "ftyp") return "video/mp4";
  return "";
}

function text(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function isUnsafeFilenameChar(char: string) {
  const code = char.charCodeAt(0);
  return code < 32 || code === 127 || '<>:"|?*'.includes(char);
}

export function createObjectKey(kind: "upload" | "image" | "video", id: string, extension: string) {
  const cleanExtension = extension.replace(/^\./, "").toLowerCase();
  return `${kind}/${new Date().toISOString().slice(0, 10)}/${id}.${cleanExtension}`;
}

export async function createAssetCapabilityToken(objectKey: string, expiresAt: number, secret: string) {
  const signature = await hmacSha256Base64Url(secret, `${objectKey}.${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

export async function verifyAssetCapabilityToken(objectKey: string, nowSeconds: number, token: string, secret: string) {
  const [expiresAtText, signature] = token.split(".");
  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || expiresAt < nowSeconds || !signature) return false;
  const expected = await hmacSha256Base64Url(secret, `${objectKey}.${expiresAt}`);
  return timingSafeEqual(signature, expected);
}
