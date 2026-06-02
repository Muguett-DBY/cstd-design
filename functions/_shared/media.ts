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
    if (!ALLOWED_TYPES.has(file.type)) return { ok: false as const, error: "只支持 PNG、JPEG、WebP 或 MP4 文件。" };
    if (file.size > (options.maxSize ?? DEFAULT_MAX_SIZE)) return { ok: false as const, error: "文件过大，请压缩后再上传。" };
  }
  return { ok: true as const };
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
