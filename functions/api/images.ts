import { AgnesClient } from "../_shared/agnes";
import { assetById, getExtension, json, readJson, requireSession, type PagesContext } from "../_shared/http";
import { createAssetCapabilityToken, createObjectKey } from "../_shared/media";
import type { ImageSize } from "../_shared/provider";

export async function onRequestPost({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const body = await readJson<{ prompt?: string; size?: ImageSize; referenceAssetIds?: string[] }>(request);
  const prompt = body?.prompt?.trim();
  if (!prompt) return json({ error: "请输入图片提示词。" }, 400);
  const size = body?.size || "1024x1024";
  const referenceUrls = await capabilityUrls(request, env, body?.referenceAssetIds || []);
  const client = new AgnesClient({ apiKey: env.AGNES_API_KEY });
  try {
    const remoteUrl = await client.image({ prompt, size, referenceUrls });
    const remote = await client.fetchRemote(remoteUrl);
    const contentType = remote.headers.get("content-type") || "image/png";
    const id = crypto.randomUUID();
    const objectKey = createObjectKey("image", id, getExtension(`image.${contentType.split("/")[1] || "png"}`, contentType));
    await env.MEDIA_BUCKET.put(objectKey, remote.body, { httpMetadata: { contentType } });
    const sizeValue = Number(remote.headers.get("content-length") || 0);
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO assets (id, kind, media_type, object_key, filename, size, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
      .bind(id, "image", contentType, objectKey, `naihuangbao-${id}.png`, sizeValue, now)
      .run();
    return json({ asset: { id, kind: "image", mediaType: contentType, filename: `naihuangbao-${id}.png`, size: sizeValue, createdAt: now, url: `/api/assets/${id}` } }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "图片生成失败。" }, 502);
  }
}

async function capabilityUrls(request: Request, env: PagesContext["env"], ids: string[]) {
  const origin = new URL(request.url).origin;
  const urls: string[] = [];
  for (const id of ids.slice(0, 4)) {
    const asset = await assetById(env, id);
    if (!asset) continue;
    const expires = Math.floor(Date.now() / 1000) + 15 * 60;
    const token = await createAssetCapabilityToken(asset.object_key, expires, env.ASSET_CAPABILITY_SECRET);
    urls.push(`${origin}/api/capability?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`);
  }
  return urls;
}
