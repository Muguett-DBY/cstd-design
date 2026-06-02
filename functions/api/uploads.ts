import { createObjectKey, validateUpload } from "../_shared/media";
import { getExtension, json, requireSession, type PagesContext } from "../_shared/http";

export async function onRequestPost({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  const validation = validateUpload(files, { maxCount: 4 });
  if (!validation.ok) return json({ error: validation.error }, 400);

  const assets = [];
  for (const file of files) {
    const id = crypto.randomUUID();
    const objectKey = createObjectKey("upload", id, getExtension(file.name, file.type));
    await env.MEDIA_BUCKET.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type } });
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO assets (id, kind, media_type, object_key, filename, size, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
      .bind(id, "upload", file.type, objectKey, file.name, file.size, now)
      .run();
    assets.push({ id, kind: "upload", mediaType: file.type, filename: file.name, size: file.size, createdAt: now, url: `/api/assets/${id}` });
  }

  return json({ assets }, 201);
}
