import { assetById, json, type PagesContext } from "../_shared/http";
import { verifyAssetCapabilityToken } from "../_shared/media";

export async function onRequestGet({ request, env }: PagesContext) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");
  if (!id || !token) return json({ error: "链接无效。" }, 400);
  const asset = await assetById(env, id);
  if (!asset) return json({ error: "素材不存在。" }, 404);
  const ok = await verifyAssetCapabilityToken(asset.object_key, Math.floor(Date.now() / 1000), token, env.ASSET_CAPABILITY_SECRET);
  if (!ok) return json({ error: "链接已过期。" }, 403);
  const object = await env.MEDIA_BUCKET.get(asset.object_key);
  if (!object) return json({ error: "文件不存在。" }, 404);
  return new Response(object.body, { headers: { "Content-Type": asset.media_type, "Cache-Control": "no-store" } });
}
