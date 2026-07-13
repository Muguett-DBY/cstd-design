import { assetById, type Env } from "./http";

const DELETE_BATCH_SIZE = 100;
const MAX_RETRY_DELAY_MS = 60 * 60_000;

export interface AssetDeletionOutcome {
  deleted: number;
  r2Objects: number;
  r2Deferred: number;
}

export interface AssetCleanupOutcome {
  r2Objects: number;
  r2Deferred: number;
}

type QueuedObject = { object_key: string };

function placeholders(count: number, offset = 1) {
  return Array.from({ length: count }, (_, index) => `?${index + offset}`).join(", ");
}

function uniqueObjectKeys(objectKeys: string[]) {
  return Array.from(new Set(objectKeys.filter((key) => key.trim().length > 0)));
}

export function assertD1BatchSucceeded(results: D1Result[], expected: number) {
  if (results.length !== expected || results.some((result) => !result.success)) {
    throw new Error("素材删除事务失败。");
  }
}

export function prepareAssetKindDeletionQueue(
  db: D1Database,
  kinds: string[],
  queuedAt = Date.now(),
) {
  const selectedKinds = placeholders(kinds.length, 2);
  const survivorKinds = placeholders(kinds.length, 2 + kinds.length);
  return db.prepare(
    `INSERT OR REPLACE INTO asset_deletion_queue
       (object_key, queued_at, attempts, next_attempt_at, last_attempt_at)
     SELECT DISTINCT doomed.object_key, ?1, 0, 0, NULL
     FROM assets AS doomed
     WHERE doomed.kind IN (${selectedKinds})
       AND TRIM(doomed.object_key) <> ''
       AND NOT EXISTS (
         SELECT 1 FROM assets AS survivor
         WHERE survivor.object_key = doomed.object_key
           AND survivor.kind NOT IN (${survivorKinds})
       )`,
  ).bind(queuedAt, ...kinds, ...kinds);
}

async function listEligibleQueueEntries(env: Env, objectKeys?: string[]) {
  const now = Date.now();
  if (!objectKeys) {
    const result = await env.DB.prepare(
      `SELECT queue.object_key
       FROM asset_deletion_queue AS queue
       WHERE queue.next_attempt_at <= ?1
         AND NOT EXISTS (
           SELECT 1 FROM assets WHERE assets.object_key = queue.object_key
         )
       ORDER BY queue.queued_at ASC
       LIMIT ?2`,
    ).bind(now, DELETE_BATCH_SIZE).all<QueuedObject>();
    return uniqueObjectKeys((result.results || []).map((row) => row.object_key));
  }

  const eligible: string[] = [];
  const keys = uniqueObjectKeys(objectKeys);
  for (let index = 0; index < keys.length; index += DELETE_BATCH_SIZE) {
    const chunk = keys.slice(index, index + DELETE_BATCH_SIZE);
    const result = await env.DB.prepare(
      `SELECT queue.object_key
       FROM asset_deletion_queue AS queue
       WHERE queue.object_key IN (${placeholders(chunk.length)})
         AND NOT EXISTS (
           SELECT 1 FROM assets WHERE assets.object_key = queue.object_key
         )`,
    ).bind(...chunk).all<QueuedObject>();
    eligible.push(...(result.results || []).map((row) => row.object_key));
  }
  return uniqueObjectKeys(eligible);
}

async function acknowledgeDeletedObjects(env: Env, objectKeys: string[]) {
  await env.DB.prepare(
    `DELETE FROM asset_deletion_queue WHERE object_key IN (${placeholders(objectKeys.length)})`,
  ).bind(...objectKeys).run();
}

async function deferDeletedObjects(env: Env, objectKeys: string[]) {
  const now = Date.now();
  await env.DB.prepare(
    `UPDATE asset_deletion_queue
     SET attempts = attempts + 1,
         last_attempt_at = ?1,
         next_attempt_at = ?1 + MIN(?2, 1000 * (1 << MIN(attempts, 12)))
     WHERE object_key IN (${placeholders(objectKeys.length, 3)})`,
  ).bind(now, MAX_RETRY_DELAY_MS, ...objectKeys).run();
}

export async function drainAssetDeletionQueue(
  env: Env,
  objectKeys?: string[],
): Promise<AssetCleanupOutcome> {
  const eligible = await listEligibleQueueEntries(env, objectKeys);
  const outcome: AssetCleanupOutcome = { r2Objects: 0, r2Deferred: 0 };

  for (let index = 0; index < eligible.length; index += DELETE_BATCH_SIZE) {
    const chunk = eligible.slice(index, index + DELETE_BATCH_SIZE);
    try {
      await env.MEDIA_BUCKET.delete(chunk);
      outcome.r2Objects += chunk.length;
      try {
        await acknowledgeDeletedObjects(env, chunk);
      } catch (error) {
        console.error("R2 素材清理确认失败，将安全重试。", error);
      }
    } catch (error) {
      outcome.r2Deferred += chunk.length;
      try {
        await deferDeletedObjects(env, chunk);
      } catch (retryError) {
        console.error("素材清理重试状态写入失败。", retryError);
      }
      console.error("R2 素材清理已延后。", error);
    }
  }

  return outcome;
}

export async function deleteAssetRecord(env: Env, id: string): Promise<AssetDeletionOutcome> {
  const asset = await assetById(env, id);
  if (!asset) return { deleted: 0, r2Objects: 0, r2Deferred: 0 };

  const queuedAt = Date.now();
  const statements = [
    env.DB.prepare(
      `INSERT OR REPLACE INTO asset_deletion_queue
         (object_key, queued_at, attempts, next_attempt_at, last_attempt_at)
       SELECT ?1, ?2, 0, 0, NULL
       WHERE EXISTS (
         SELECT 1 FROM assets WHERE id = ?3 AND object_key = ?1
       )
         AND NOT EXISTS (
           SELECT 1 FROM assets WHERE object_key = ?1 AND id <> ?3
         )`,
    ).bind(asset.object_key, queuedAt, asset.id),
    env.DB.prepare(`DELETE FROM assets WHERE id = ?1 AND object_key = ?2`).bind(asset.id, asset.object_key),
  ];
  const results = await env.DB.batch(statements);
  assertD1BatchSucceeded(results, statements.length);

  const deleted = Number(results[1]?.meta.changes || 0) > 0 ? 1 : 0;
  if (!deleted) return { deleted: 0, r2Objects: 0, r2Deferred: 0 };
  const cleanup = await drainAssetDeletionQueue(env, [asset.object_key]);
  return { deleted, ...cleanup };
}
