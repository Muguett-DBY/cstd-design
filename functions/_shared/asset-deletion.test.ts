import { describe, expect, test, vi } from "vitest";
import { deleteAssetRecord, drainAssetDeletionQueue } from "./asset-deletion";
import type { Env } from "./http";

type FakeStatement = D1PreparedStatement & {
  sql: string;
  values: unknown[];
};

function d1Result(changes = 1): D1Result {
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

function harness({
  asset = {
    id: "asset-1",
    kind: "upload" as const,
    media_type: "image/png",
    object_key: "upload/asset-1.png",
    filename: "asset.png",
    size: 3,
    created_at: "2026-07-13T00:00:00.000Z",
  },
  eligibleKeys = ["upload/asset-1.png"],
  batchImpl = async (statements: D1PreparedStatement[]) => statements.map(() => d1Result()),
}: {
  asset?: {
    id: string;
    kind: "upload" | "image" | "video";
    media_type: string;
    object_key: string;
    filename: string;
    size: number;
    created_at: string;
  } | null;
  eligibleKeys?: string[];
  batchImpl?: (statements: D1PreparedStatement[]) => Promise<D1Result[]>;
} = {}) {
  const run = vi.fn(async () => d1Result());
  const prepare = vi.fn((sql: string) => {
    const make = (values: unknown[] = []): FakeStatement => ({
      sql,
      values,
      bind: (...nextValues: unknown[]) => make(nextValues),
      first: vi.fn(async () => sql.includes("FROM assets WHERE id") ? asset : null),
      all: vi.fn(async () => ({
        success: true,
        results: sql.includes("FROM asset_deletion_queue")
          ? eligibleKeys.map((object_key) => ({ object_key }))
          : [],
        meta: d1Result().meta,
      })),
      run,
    } as unknown as FakeStatement);
    return make();
  });
  const batch = vi.fn(batchImpl);
  const deleteObjects = vi.fn(async (_keys: string | string[]) => undefined);
  const env = {
    DB: { prepare, batch } as unknown as D1Database,
    MEDIA_BUCKET: { delete: deleteObjects } as unknown as R2Bucket,
  } as Env;
  return { env, batch, deleteObjects, prepare, run };
}

describe("durable asset deletion", () => {
  test("commits the queue and metadata deletion before removing the R2 object", async () => {
    const state = harness();

    await expect(deleteAssetRecord(state.env, "asset-1")).resolves.toEqual({
      deleted: 1,
      r2Objects: 1,
      r2Deferred: 0,
    });

    expect(state.batch).toHaveBeenCalledOnce();
    const statements = state.batch.mock.calls[0][0] as FakeStatement[];
    expect(statements).toHaveLength(2);
    expect(statements[0].sql).toContain("INSERT");
    expect(statements[0].sql).toContain("asset_deletion_queue");
    expect(statements[0].sql).toContain("NOT EXISTS");
    expect(statements[1].sql).toContain("DELETE FROM assets");
    expect(state.batch.mock.invocationCallOrder[0]).toBeLessThan(state.deleteObjects.mock.invocationCallOrder[0]);
    expect(state.deleteObjects).toHaveBeenCalledWith(["upload/asset-1.png"]);
    expect(state.prepare.mock.calls.some(([sql]) => sql.includes("DELETE FROM asset_deletion_queue"))).toBe(true);
  });

  test("does not touch R2 when the atomic D1 batch rejects", async () => {
    const d1Error = new Error("D1 unavailable");
    const state = harness({ batchImpl: async () => { throw d1Error; } });

    await expect(deleteAssetRecord(state.env, "asset-1")).rejects.toBe(d1Error);

    expect(state.deleteObjects).not.toHaveBeenCalled();
  });

  test("keeps a retryable queue row and reports logical success when R2 is unavailable", async () => {
    const state = harness();
    state.deleteObjects.mockRejectedValueOnce(new Error("R2 unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(deleteAssetRecord(state.env, "asset-1")).resolves.toEqual({
      deleted: 1,
      r2Objects: 0,
      r2Deferred: 1,
    });

    expect(state.prepare.mock.calls.some(([sql]) => sql.includes("UPDATE asset_deletion_queue"))).toBe(true);
    expect(consoleError).toHaveBeenCalledWith("R2 素材清理已延后。", expect.any(Error));
    consoleError.mockRestore();
  });

  test("returns an idempotent no-op when the asset metadata is already absent", async () => {
    const state = harness({ asset: null, eligibleKeys: [] });

    await expect(deleteAssetRecord(state.env, "missing")).resolves.toEqual({
      deleted: 0,
      r2Objects: 0,
      r2Deferred: 0,
    });

    expect(state.batch).not.toHaveBeenCalled();
    expect(state.deleteObjects).not.toHaveBeenCalled();
  });

  test("drains only queue entries no longer referenced by asset metadata", async () => {
    const state = harness({ eligibleKeys: ["orphan/a.png", "orphan/b.png"] });

    await expect(drainAssetDeletionQueue(state.env)).resolves.toEqual({
      r2Objects: 2,
      r2Deferred: 0,
    });

    expect(state.prepare.mock.calls.some(([sql]) => (
      sql.includes("FROM asset_deletion_queue")
      && sql.includes("NOT EXISTS")
      && sql.includes("next_attempt_at")
    ))).toBe(true);
    expect(state.deleteObjects).toHaveBeenCalledWith(["orphan/a.png", "orphan/b.png"]);
  });
});
