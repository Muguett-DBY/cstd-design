import { AgnesClient } from "../_shared/agnes";
import { assetById, enforceRateLimit, getExtension, json, readJson, requireSession, upstreamApiKey, type PagesContext } from "../_shared/http";
import { createAssetCapabilityToken, createObjectKey, safeMediaType } from "../_shared/media";
import { toClientError, type ImageSize } from "../_shared/provider";
import { ImageRequestSchema, parseRequest } from "../_shared/validation";

export async function onRequestPost({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const limited = await enforceRateLimit(env, auth.session.sessionId, "image", 20, 60 * 60_000);
  if (limited) return limited;
  const parsed = parseRequest(ImageRequestSchema, await readJson(request));
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const body = parsed.data;
  const prompt = body.prompt;
  const size: ImageSize = body.size;
  const referenceUrls = await capabilityUrls(request, env, body.referenceAssetIds);
  const client = new AgnesClient({ apiKey: upstreamApiKey(env) });
  try {
    const remoteUrl = await client.image({ prompt, size, referenceUrls });
    const remote = await client.fetchRemote(remoteUrl);
    const contentType = safeMediaType(remote.headers.get("content-type"), "image/png");
    const id = crypto.randomUUID();
    const filename = `image-${id}.${getExtension(`image.${contentType.split("/")[1] || "png"}`, contentType)}`;
    const objectKey = createObjectKey("image", id, getExtension(filename, contentType));
    await env.MEDIA_BUCKET.put(objectKey, remote.body, { httpMetadata: { contentType } });
    const sizeValue = Number(remote.headers.get("content-length") || 0);
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO assets (id, kind, media_type, object_key, filename, size, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
      .bind(id, "image", contentType, objectKey, filename, sizeValue, now)
      .run();
    return json({ asset: { id, kind: "image", mediaType: contentType, filename, size: sizeValue, createdAt: now, url: `/api/assets/${id}` } }, 201);
  } catch (error) {
    return json({ error: toClientError(error, "图片生成失败，请稍后重试。") }, 502);
  }
}

async function capabilityUrls(request: Request, env: PagesContext["env"], ids: string[]) {
  const origin = new URL(request.url).origin;
  const urls: string[] = [];
  for (const id of ids.slice(0, 4)) {
    const asset = await assetById(env, id);
    if (!asset) continue;
    if (!safeMediaType(asset.media_type).startsWith("image/")) continue;
    const expires = Math.floor(Date.now() / 1000) + 15 * 60;
    const token = await createAssetCapabilityToken(asset.object_key, expires, env.ASSET_CAPABILITY_SECRET);
    urls.push(`${origin}/api/capability?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`);
  }
  return urls;
}
