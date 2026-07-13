import { describe, expect, test, vi } from "vitest";
import {
  persistAssetBatch,
  type AssetPersistenceInput,
} from "./asset-persistence";

type CapturedStatement = {
  sql: string;
  values: unknown[];
};

function statement(sql: string, values: unknown[] = []): D1PreparedStatement {
  return {
    sql,
    values,
    bind: (...nextValues: unknown[]) => statement(sql, nextValues),
  } as unknown as D1PreparedStatement;
}

function database(batchImpl: (statements: D1PreparedStatement[]) => Promise<D1Result[]>) {
  const batch = vi.fn(batchImpl);
  const prepare = vi.fn((sql: string) => statement(sql));
  return {
    db: { batch, prepare } as unknown as D1Database,
    batch,
    prepare,
  };
}

function bucket() {
  const put = vi.fn(async (
    key: string,
    value: Parameters<R2Bucket["put"]>[1],
    options?: R2PutOptions,
  ) => {
    void key;
    void value;
    void options;
    return {} as R2Object;
  });
  const deleteObjects = vi.fn(async (keys: string | string[]) => {
    void keys;
  });
  return {
    bucket: { put, delete: deleteObjects } as unknown as R2Bucket,
    put,
    deleteObjects,
  };
}

const assets: AssetPersistenceInput[] = [
  {
    id: "asset-1",
    kind: "upload",
    mediaType: "image/png",
    objectKey: "upload/asset-1.png",
    filename: "one.png",
    size: 3,
    createdAt: "2026-07-13T00:00:00.000Z",
    body: new Uint8Array([1, 2, 3]),
  },
  {
    id: "asset-2",
    kind: "upload",
    mediaType: "image/png",
    objectKey: "upload/asset-2.png",
    filename: "two.png",
    size: 2,
    createdAt: "2026-07-13T00:00:01.000Z",
    body: new Uint8Array([4, 5]),
  },
];

function result(changes = 1): D1Result {
  return {
    success: true,
    results: [],
    meta: {
      duration: 0,
      size_after: 0,
      rows_read: 0,
      rows_written: changes,
      last_row_id: 0,
      changed_db: changes > 0,
      changes,
    },
  };
}

const successfulResult = result();

describe("persistAssetBatch", () => {
  test("writes every object before one D1 batch containing asset rows and related statements", async () => {
    const { db, batch } = database(async () => [successfulResult, successfulResult, successfulResult]);
    const media = bucket();
    const related = statement("UPDATE video_tasks SET asset_id = ?1 WHERE id = ?2", ["asset-1", "task-1"]);

    await persistAssetBatch(db, media.bucket, assets, { afterStatements: [related] });

    expect(media.put).toHaveBeenCalledTimes(2);
    expect(media.put.mock.calls.map(([key]) => key)).toEqual([
      "upload/asset-1.png",
      "upload/asset-2.png",
    ]);
    expect(batch).toHaveBeenCalledOnce();
    const statements = batch.mock.calls[0][0] as unknown as CapturedStatement[];
    expect(statements).toHaveLength(3);
    expect(statements.slice(0, 2).every((entry) => entry.sql.includes("INSERT INTO assets"))).toBe(true);
    expect(statements[0].values).toEqual([
      "asset-1",
      "upload",
      "image/png",
      "upload/asset-1.png",
      "one.png",
      3,
      "2026-07-13T00:00:00.000Z",
    ]);
    expect(statements[2]).toEqual(expect.objectContaining({
      sql: expect.stringContaining("UPDATE video_tasks"),
      values: ["asset-1", "task-1"],
    }));
    expect(media.deleteObjects).not.toHaveBeenCalled();
  });

  test("deletes every object when the atomic D1 batch rejects", async () => {
    const persistenceError = new Error("D1 batch failed");
    const { db } = database(async () => { throw persistenceError; });
    const media = bucket();

    await expect(persistAssetBatch(db, media.bucket, assets)).rejects.toBe(persistenceError);

    expect(media.deleteObjects).toHaveBeenCalledOnce();
    expect(media.deleteObjects).toHaveBeenCalledWith([
      "upload/asset-1.png",
      "upload/asset-2.png",
    ]);
  });

  test("cleans the key whose R2 put was attempted when a later put rejects", async () => {
    const storageError = new Error("R2 put failed");
    const { db, batch } = database(async () => [successfulResult, successfulResult]);
    const media = bucket();
    media.put.mockResolvedValueOnce({} as R2Object).mockRejectedValueOnce(storageError);

    await expect(persistAssetBatch(db, media.bucket, assets)).rejects.toBe(storageError);

    expect(batch).not.toHaveBeenCalled();
    expect(media.deleteObjects).toHaveBeenCalledWith([
      "upload/asset-1.png",
      "upload/asset-2.png",
    ]);
  });

  test("treats an unsuccessful resolved D1 result as a failed transaction", async () => {
    const { db } = database(async () => [successfulResult, { ...result(), success: false } as unknown as D1Result]);
    const media = bucket();

    await expect(persistAssetBatch(db, media.bucket, assets)).rejects.toThrow("媒体元数据事务失败");
    expect(media.deleteObjects).toHaveBeenCalledWith([
      "upload/asset-1.png",
      "upload/asset-2.png",
    ]);
  });

  test("rejects a transaction that did not insert every asset row", async () => {
    const { db } = database(async () => [result(), result(0)]);
    const media = bucket();

    await expect(persistAssetBatch(db, media.bucket, assets)).rejects.toThrow("媒体元数据事务失败");
    expect(media.deleteObjects).toHaveBeenCalledWith([
      "upload/asset-1.png",
      "upload/asset-2.png",
    ]);
  });

  test("can link a related row before a conditionally inserted asset", async () => {
    const { db, batch } = database(async () => [result(), result()]);
    const media = bucket();
    const linkTask = statement("UPDATE video_tasks SET asset_id = ?1 WHERE id = ?2", ["asset-1", "task-1"]);

    await persistAssetBatch(db, media.bucket, [assets[0]], {
      beforeStatements: [linkTask],
      insertCondition: {
        sql: "EXISTS (SELECT 1 FROM video_tasks WHERE id = ?8 AND asset_id = ?1)",
        values: () => ["task-1"],
      },
    });

    const statements = batch.mock.calls[0][0] as unknown as CapturedStatement[];
    expect(statements[0]).toEqual(expect.objectContaining({
      sql: expect.stringContaining("UPDATE video_tasks"),
      values: ["asset-1", "task-1"],
    }));
    expect(statements[1].sql).toContain("WHERE EXISTS");
    expect(statements[1].values).toEqual([
      "asset-1",
      "upload",
      "image/png",
      "upload/asset-1.png",
      "one.png",
      3,
      "2026-07-13T00:00:00.000Z",
      "task-1",
    ]);
  });

  test("preserves the original persistence error when cleanup also fails", async () => {
    const persistenceError = new Error("D1 unavailable");
    const { db } = database(async () => { throw persistenceError; });
    const media = bucket();
    media.deleteObjects.mockRejectedValueOnce(new Error("R2 cleanup unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(persistAssetBatch(db, media.bucket, assets)).rejects.toBe(persistenceError);

    expect(consoleError).toHaveBeenCalledWith(
      "媒体持久化失败后的 R2 清理也失败。",
      expect.any(Error),
    );
    consoleError.mockRestore();
  });
});
