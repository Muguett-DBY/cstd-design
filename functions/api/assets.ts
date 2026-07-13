import { json, requireSession, type PagesContext } from "../_shared/http";
import { drainAssetDeletionQueue } from "../_shared/asset-deletion";
import { publicFilename, safeMediaType } from "../_shared/media";

export async function onRequestGet({ request, env, waitUntil }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  waitUntil(drainAssetDeletionQueue(env).catch((error) => {
    console.error("延后素材清理任务执行失败。", error);
  }));
  const url = new URL(request.url);
  const filter = url.searchParams.get("kind");
  const query = filter
    ? `SELECT id, kind, media_type as mediaType, filename, size, created_at as createdAt FROM assets WHERE kind = ?1 ORDER BY created_at DESC LIMIT 200`
    : `SELECT id, kind, media_type as mediaType, filename, size, created_at as createdAt FROM assets ORDER BY created_at DESC LIMIT 200`;
  const result = filter ? await env.DB.prepare(query).bind(filter).all() : await env.DB.prepare(query).all();
  const assets = (result.results || []).map((asset: Record<string, unknown>) => ({
    ...asset,
    mediaType: safeMediaType(String(asset.mediaType || "")),
    filename: publicFilename(String(asset.filename || "")),
    url: `/api/assets/${asset.id}`,
  }));
  return json({ assets }, 200, { "Cache-Control": "private, no-store" });
}
