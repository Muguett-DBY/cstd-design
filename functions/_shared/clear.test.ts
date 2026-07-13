import { describe, expect, test, vi } from "vitest";
import { clearWorkspaceScope } from "./clear";
import type { Env } from "./http";

type FakeStatement = D1PreparedStatement & { sql: string; values: unknown[] };

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

function clearHarness(batchImpl?: (statements: D1PreparedStatement[]) => Promise<D1Result[]>) {
  const assets = [
    { id: "asset-1", object_key: "image/asset-1.png" },
    { id: "asset-2", object_key: "video/asset-2.mp4" },
  ];
  const counts: Record<string, number> = {
    conversations: 2,
    messages: 5,
    video_tasks: 1,
  };
  const run = vi.fn(async () => result());
  const prepare = vi.fn((sql: string) => {
    const make = (values: unknown[] = []): FakeStatement => ({
      sql,
      values,
      bind: (...nextValues: unknown[]) => make(nextValues),
      first: vi.fn(async () => {
        const table = Object.keys(counts).find((name) => sql.includes(`FROM ${name}`));
        return { count: table ? counts[table] : 0 };
      }),
      all: vi.fn(async () => ({
        success: true,
        results: sql.includes("SELECT id, object_key FROM assets")
          ? assets
          : sql.includes("FROM asset_deletion_queue")
            ? assets.map(({ object_key }) => ({ object_key }))
            : [],
        meta: result().meta,
      })),
      run,
    } as unknown as FakeStatement);
    return make();
  });
  const batch = vi.fn(batchImpl ?? (async (statements) => statements.map(() => result())));
  const deleteObjects = vi.fn(async (_keys: string | string[]) => undefined);
  const env = {
    DB: { prepare, batch } as unknown as D1Database,
    MEDIA_BUCKET: { delete: deleteObjects } as unknown as R2Bucket,
  } as Env;
  return { env, batch, deleteObjects, prepare };
}

describe("clearWorkspaceScope cross-store consistency", () => {
  test("commits every D1 deletion and durable R2 cleanup record in one batch", async () => {
    const state = clearHarness();

    await expect(clearWorkspaceScope(state.env, "all")).resolves.toEqual({
      conversations: 2,
      messages: 5,
      assets: 2,
      videoTasks: 1,
      r2Objects: 2,
      r2Deferred: 0,
    });

    expect(state.batch).toHaveBeenCalledOnce();
    const statements = state.batch.mock.calls[0][0] as FakeStatement[];
    const sql = statements.map((entry) => entry.sql);
    expect(sql.some((entry) => entry.includes("DELETE FROM conversations"))).toBe(true);
    expect(sql.some((entry) => entry.includes("DELETE FROM video_tasks"))).toBe(true);
    expect(sql.some((entry) => entry.includes("asset_deletion_queue"))).toBe(true);
    expect(sql.some((entry) => entry.includes("DELETE FROM assets"))).toBe(true);
    expect(state.batch.mock.invocationCallOrder[0]).toBeLessThan(state.deleteObjects.mock.invocationCallOrder[0]);
  });

  test("does not delete R2 objects when the D1 transaction fails", async () => {
    const error = new Error("D1 batch failed");
    const state = clearHarness(async () => { throw error; });

    await expect(clearWorkspaceScope(state.env, "assets")).rejects.toBe(error);

    expect(state.deleteObjects).not.toHaveBeenCalled();
  });

  test("reports deferred physical cleanup without undoing committed logical deletion", async () => {
    const state = clearHarness();
    state.deleteObjects.mockRejectedValueOnce(new Error("R2 unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(clearWorkspaceScope(state.env, "assets")).resolves.toMatchObject({
      assets: 2,
      r2Objects: 0,
      r2Deferred: 2,
    });

    expect(state.prepare.mock.calls.some(([sql]) => sql.includes("UPDATE asset_deletion_queue"))).toBe(true);
    expect(consoleError).toHaveBeenCalledWith("R2 素材清理已延后。", expect.any(Error));
    consoleError.mockRestore();
  });
});
