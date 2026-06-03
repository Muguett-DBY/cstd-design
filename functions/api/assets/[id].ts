import { assetById, json, requireSession, type PagesContext } from "../../_shared/http";
import { contentDisposition, safeMediaType } from "../../_shared/media";

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const asset = await assetById(env, String(params.id));
  if (!asset) return json({ error: "素材不存在。" }, 404);
  const object = await env.MEDIA_BUCKET.get(asset.object_key);
  if (!object) return json({ error: "文件不存在。" }, 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": safeMediaType(asset.media_type),
      "Content-Disposition": contentDisposition(asset.filename, !!new URL(request.url).searchParams.get("download")),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const asset = await assetById(env, String(params.id));
  if (!asset) return json({ ok: true });
  await env.MEDIA_BUCKET.delete(asset.object_key);
  await env.DB.prepare(`DELETE FROM assets WHERE id = ?1`).bind(asset.id).run();
  return json({ ok: true });
}
