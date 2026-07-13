export type AssetKind = "upload" | "image" | "video";

export interface AssetPersistenceInput {
  id: string;
  kind: AssetKind;
  mediaType: string;
  objectKey: string;
  filename: string;
  size: number;
  createdAt: string;
  body: Parameters<R2Bucket["put"]>[1];
}

export interface AssetPersistenceOptions {
  beforeStatements?: D1PreparedStatement[];
  afterStatements?: D1PreparedStatement[];
  insertCondition?: {
    sql: string;
    values: (asset: AssetPersistenceInput) => unknown[];
  };
}

const INSERT_ASSET_PREFIX = "INSERT INTO assets (id, kind, media_type, object_key, filename, size, created_at)";

function prepareAssetInsert(db: D1Database, asset: AssetPersistenceInput, condition?: AssetPersistenceOptions["insertCondition"]) {
  const sql = condition
    ? `${INSERT_ASSET_PREFIX} SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7 WHERE ${condition.sql}`
    : `${INSERT_ASSET_PREFIX} VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`;
  return db.prepare(sql).bind(
    asset.id,
    asset.kind,
    asset.mediaType,
    asset.objectKey,
    asset.filename,
    asset.size,
    asset.createdAt,
    ...(condition?.values(asset) ?? []),
  );
}

export async function persistAssetBatch(
  db: D1Database,
  bucket: R2Bucket,
  assets: AssetPersistenceInput[],
  options: AssetPersistenceOptions = {},
) {
  if (assets.length === 0) return;

  const attemptedKeys: string[] = [];

  try {
    for (const asset of assets) {
      attemptedKeys.push(asset.objectKey);
      await bucket.put(asset.objectKey, asset.body, {
        httpMetadata: { contentType: asset.mediaType },
      });
    }

    const beforeStatements = options.beforeStatements ?? [];
    const assetStatements = assets.map((asset) => prepareAssetInsert(db, asset, options.insertCondition));
    const statements = [
      ...beforeStatements,
      ...assetStatements,
      ...(options.afterStatements ?? []),
    ];
    const results = await db.batch(statements);
    const assetResults = results.slice(beforeStatements.length, beforeStatements.length + assetStatements.length);

    if (
      results.length !== statements.length
      || results.some((result) => !result.success)
      || assetResults.some((result) => result.meta.changes !== 1)
    ) {
      throw new Error("媒体元数据事务失败。");
    }
  } catch (error) {
    if (attemptedKeys.length > 0) {
      try {
        await bucket.delete(attemptedKeys);
      } catch (cleanupError) {
        console.error("媒体持久化失败后的 R2 清理也失败。", cleanupError);
      }
    }
    throw error;
  }
}
