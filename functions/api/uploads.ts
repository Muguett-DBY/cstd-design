import { createObjectKey, publicFilename, safeMediaType, sanitizeFilename, validateUpload, validateUploadContents } from "../_shared/media";
import { enforceRateLimit, getExtension, json, requireSession, type PagesContext } from "../_shared/http";

export async function onRequestPost({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const limited = await enforceRateLimit(env, auth.session.sessionId, "upload", 30, 60_000);
  if (limited) return limited;
  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  const validation = validateUpload(files, { maxCount: 4 });
  if (!validation.ok) return json({ error: validation.error }, 400);
  const contentValidation = await validateUploadContents(files);
  if (!contentValidation.ok) return json({ error: contentValidation.error }, 400);

  const assets = [];
  const uploadedKeys: string[] = [];
  try {
    for (const file of files) {
      const id = crypto.randomUUID();
      const mediaType = safeMediaType(file.type);
      const filename = sanitizeFilename(file.name, `upload-${id}.${getExtension(file.name, mediaType)}`);
      const objectKey = createObjectKey("upload", id, getExtension(filename, mediaType));
      await env.MEDIA_BUCKET.put(objectKey, file.stream(), { httpMetadata: { contentType: mediaType } });
      uploadedKeys.push(objectKey);
      const now = new Date().toISOString();
      await env.DB.prepare(`INSERT INTO assets (id, kind, media_type, object_key, filename, size, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
        .bind(id, "upload", mediaType, objectKey, filename, file.size, now)
        .run();
      assets.push({ id, kind: "upload", mediaType, filename: publicFilename(filename), size: file.size, createdAt: now, url: `/api/assets/${id}` });
    }
  } catch (error) {
    // Clean up any files already uploaded to R2 before the failure
    if (uploadedKeys.length) await env.MEDIA_BUCKET.delete(uploadedKeys);
    throw error;
  }

  return json({ assets }, 201);
}
