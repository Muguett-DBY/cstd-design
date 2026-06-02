import { AgnesClient } from "../_shared/agnes";
import { assetById, json, readJson, requireSession, type PagesContext } from "../_shared/http";
import { createAssetCapabilityToken } from "../_shared/media";
import type { VideoPreset } from "../_shared/provider";

export async function onRequestPost({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const active = await env.DB.prepare(
    `SELECT id FROM video_tasks WHERE asset_id IS NULL AND status IN ('queued', 'in_progress') AND created_at > ?1 LIMIT 1`,
  )
    .bind(new Date(Date.now() - 2 * 60 * 60_000).toISOString())
    .first<{ id: string }>();
  if (active) return json({ error: "当前已有一个视频任务，请完成或放弃后再开始。" }, 409);

  const body = await readJson<{
    prompt?: string;
    preset?: VideoPreset;
    fps?: number;
    width?: number;
    height?: number;
    negativePrompt?: string;
    seed?: number;
    referenceAssetIds?: string[];
    keyframes?: boolean;
  }>(request);
  const prompt = body?.prompt?.trim();
  if (!prompt) return json({ error: "请输入视频提示词。" }, 400);
  const referenceUrls = await capabilityUrls(request, env, body?.referenceAssetIds || []);
  const client = new AgnesClient({ apiKey: env.AGNES_API_KEY });
  try {
    const created = await client.createVideo({
      prompt,
      preset: body?.preset || "standard",
      fps: body?.fps,
      width: body?.width,
      height: body?.height,
      referenceUrls,
      keyframes: body?.keyframes,
      negativePrompt: body?.negativePrompt,
      seed: body?.seed,
    });
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO video_tasks (id, provider_task_id, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)`)
      .bind(id, created.id, created.status || "queued", now, now)
      .run();
    return json({ task: { id, status: created.status || "queued", progress: created.progress || 0 } }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "视频任务创建失败。" }, 502);
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
