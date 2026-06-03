import { AgnesClient } from "../../_shared/agnes";
import { createObjectKey } from "../../_shared/media";
import { json, requireSession, upstreamApiKey, type PagesContext } from "../../_shared/http";
import { toClientError } from "../../_shared/provider";

export async function onRequestGet({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const row = await env.DB.prepare(`SELECT id, provider_task_id, status, asset_id FROM video_tasks WHERE id = ?1`)
    .bind(String(params.id))
    .first<{ id: string; provider_task_id: string; status: string; asset_id: string | null }>();
  if (!row) return json({ error: "任务不存在。" }, 404);
  if (row.asset_id) return json({ task: { id: row.id, status: "completed", progress: 100, assetId: row.asset_id, assetUrl: `/api/assets/${row.asset_id}` } });

  const client = new AgnesClient({ apiKey: upstreamApiKey(env) });
  try {
    const task = await client.readVideo(row.provider_task_id);
    if (task.status === "completed" && task.videoUrl) {
      const remote = await client.fetchRemote(task.videoUrl);
      const id = crypto.randomUUID();
      const objectKey = createObjectKey("video", id, "mp4");
      const filename = `video-${id}.mp4`;
      await env.MEDIA_BUCKET.put(objectKey, remote.body, { httpMetadata: { contentType: "video/mp4" } });
      const now = new Date().toISOString();
      const size = Number(remote.headers.get("content-length") || 0);
      await env.DB.prepare(`INSERT INTO assets (id, kind, media_type, object_key, filename, size, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
        .bind(id, "video", "video/mp4", objectKey, filename, size, now)
        .run();
      await env.DB.prepare(`UPDATE video_tasks SET status = ?1, asset_id = ?2, updated_at = ?3 WHERE id = ?4`).bind("completed", id, now, row.id).run();
      return json({ task: { id: row.id, status: "completed", progress: 100, assetId: id, assetUrl: `/api/assets/${id}` } });
    }
    await env.DB.prepare(`UPDATE video_tasks SET status = ?1, updated_at = ?2 WHERE id = ?3`)
      .bind(task.status, new Date().toISOString(), row.id)
      .run();
    return json({ task: { id: row.id, status: task.status, progress: task.progress } });
  } catch (error) {
    return json({ error: toClientError(error, "视频状态查询失败，请稍后重试。") }, 502);
  }
}

export async function onRequestDelete({ request, env, params }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  await env.DB.prepare(`DELETE FROM video_tasks WHERE id = ?1 AND asset_id IS NULL`).bind(String(params.id)).run();
  return json({ ok: true });
}
