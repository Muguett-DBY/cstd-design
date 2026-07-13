import { describe, expect, test } from "vitest";
import {
  appendChatEvent,
  assetSortLabel,
  buildActiveBranch,
  createAssetRefreshCoordinator,
  filterAssets,
  formatBytes,
  initialChatDraft,
  mergeCommittedAssets,
  reconcileAssetRefresh,
  readStoredAssetSortMode,
  sortAssets,
  videoPresetToRequest,
  writeStoredAssetSortMode,
} from "./app-state";
import { ASSET_SORT_STORAGE_KEY } from "./storage-keys";
import type { AssetItem, ChatMessage } from "./types";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  },
});

describe("frontend state helpers", () => {
  test("applies streaming chat events to the assistant message", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "你好", status: "complete" },
      { id: "a1", role: "assistant", content: "", status: "streaming" },
    ];

    const afterDelta = appendChatEvent(messages, { type: "delta", assistantMessageId: "a1", content: "你好呀" });
    const afterDone = appendChatEvent(afterDelta, { type: "done", assistantMessageId: "a1" });

    expect(afterDone).toEqual([
      { id: "u1", role: "user", content: "你好", status: "complete" },
      { id: "a1", role: "assistant", content: "你好呀", status: "complete" },
    ]);
  });

  test("marks interrupted streaming answers with preserved content", () => {
    const messages: ChatMessage[] = [{ id: "a1", role: "assistant", content: "已经生成", status: "streaming" }];

    expect(appendChatEvent(messages, { type: "error", assistantMessageId: "a1", error: "网络断开" })).toEqual([
      { id: "a1", role: "assistant", content: "已经生成\n\n（已中断：网络断开）", status: "interrupted" },
    ]);
  });

  test("maps video presets to documented frame counts", () => {
    expect(videoPresetToRequest("short")).toEqual({ preset: "short", numFrames: 121, approxSeconds: 5 });
    expect(videoPresetToRequest("standard")).toEqual({ preset: "standard", numFrames: 241, approxSeconds: 10 });
    expect(videoPresetToRequest("max")).toEqual({ preset: "max", numFrames: 441, approxSeconds: 18 });
  });

  test("filters assets by kind exactly", () => {
    const assets: AssetItem[] = [
      { id: "1", kind: "upload", mediaType: "image/png", filename: "a.png", size: 1, createdAt: "1", url: "/a" },
      { id: "2", kind: "image", mediaType: "image/png", filename: "b.png", size: 1, createdAt: "2", url: "/b" },
      { id: "3", kind: "video", mediaType: "video/mp4", filename: "c.mp4", size: 1, createdAt: "3", url: "/c" },
    ];

    expect(filterAssets(assets, "image").map((asset) => asset.id)).toEqual(["2"]);
    expect(filterAssets(assets, "video").map((asset) => asset.id)).toEqual(["3"]);
    expect(filterAssets(assets, "all").map((asset) => asset.id)).toEqual(["1", "2", "3"]);
  });

  test("keeps committed assets visible across a stale list without duplicates", () => {
    const old: AssetItem = { id: "old", kind: "upload", mediaType: "image/png", filename: "old.png", size: 1, createdAt: "1", url: "/old" };
    const committedA: AssetItem = { id: "new-a", kind: "upload", mediaType: "image/png", filename: "a.png", size: 2, createdAt: "3", url: "/optimistic-a" };
    const committedB: AssetItem = { id: "new-b", kind: "upload", mediaType: "image/png", filename: "b.png", size: 3, createdAt: "2", url: "/optimistic-b" };
    const listedA: AssetItem = { ...committedA, url: "/listed-a", width: 1024 };

    expect(mergeCommittedAssets([old], [committedA, committedB]).map((asset) => asset.id)).toEqual([
      "new-a",
      "new-b",
      "old",
    ]);
    const merged = mergeCommittedAssets([old, listedA], [committedA, committedB]);
    expect(merged.map((asset) => asset.id)).toEqual(["new-a", "new-b", "old"]);
    expect(merged[0]).toEqual(listedA);
    expect(mergeCommittedAssets([old], [])).toEqual([old]);
  });

  test("preserves concurrent committed state only during a write refresh", () => {
    const old: AssetItem = { id: "old", kind: "upload", mediaType: "image/png", filename: "old.png", size: 1, createdAt: "1", url: "/old" };
    const concurrent: AssetItem = { id: "concurrent", kind: "upload", mediaType: "image/png", filename: "concurrent.png", size: 2, createdAt: "2", url: "/optimistic-concurrent" };
    const committed: AssetItem = { id: "committed", kind: "upload", mediaType: "image/png", filename: "committed.png", size: 3, createdAt: "3", url: "/optimistic-committed" };
    const listedConcurrent: AssetItem = { ...concurrent, url: "/listed-concurrent", width: 1024 };

    expect(reconcileAssetRefresh([concurrent, old], [old], [committed]).map((asset) => asset.id)).toEqual([
      "committed",
      "concurrent",
      "old",
    ]);
    const refreshed = reconcileAssetRefresh([concurrent, old], [listedConcurrent, old], [committed]);
    expect(refreshed[1]).toEqual(listedConcurrent);
    expect(reconcileAssetRefresh([concurrent, old], [old], [])).toEqual([old]);
  });

  test("keeps confirmed deletions absent across a stale asset refresh", () => {
    const deleted: AssetItem = { id: "deleted", kind: "upload", mediaType: "image/png", filename: "deleted.png", size: 1, createdAt: "3", url: "/deleted" };
    const survivor: AssetItem = { id: "survivor", kind: "image", mediaType: "image/png", filename: "survivor.png", size: 2, createdAt: "2", url: "/survivor" };
    const concurrent: AssetItem = { id: "concurrent", kind: "video", mediaType: "video/mp4", filename: "concurrent.mp4", size: 3, createdAt: "1", url: "/concurrent" };
    const listedSurvivor: AssetItem = { ...survivor, url: "/listed-survivor", width: 1024 };

    const reconciled = reconcileAssetRefresh(
      [deleted, survivor, concurrent],
      [deleted, listedSurvivor],
      [],
      [deleted.id],
    );

    expect(reconciled.map((asset) => asset.id)).toEqual(["survivor", "concurrent"]);
    expect(reconciled[0]).toEqual(listedSurvivor);
  });

  test("gives confirmed deletion precedence over a conflicting committed asset", () => {
    const deleted: AssetItem = { id: "deleted", kind: "upload", mediaType: "image/png", filename: "deleted.png", size: 1, createdAt: "1", url: "/deleted" };

    expect(reconcileAssetRefresh([deleted], [deleted], [deleted], [deleted.id])).toEqual([]);
  });

  test("ignores an older asset response after a newer deletion response is applied", () => {
    const deleted: AssetItem = { id: "deleted", kind: "upload", mediaType: "image/png", filename: "deleted.png", size: 1, createdAt: "2", url: "/deleted" };
    const survivor: AssetItem = { id: "survivor", kind: "image", mediaType: "image/png", filename: "survivor.png", size: 2, createdAt: "1", url: "/survivor" };
    const coordinator = createAssetRefreshCoordinator();
    const older = coordinator.begin();
    const deletion = coordinator.begin([], [deleted.id]);

    expect(coordinator.applyPending([deleted, survivor]).map((asset) => asset.id)).toEqual(["survivor"]);
    expect(coordinator.resolve(deletion, [survivor], [deleted, survivor])?.map((asset) => asset.id)).toEqual(["survivor"]);
    expect(coordinator.resolve(older, [survivor], [deleted, survivor])).toBeNull();
    expect(coordinator.isSuperseded(older)).toBe(true);
  });

  test("retains a deletion overlay while a newer overlapping response is still unresolved", () => {
    const deleted: AssetItem = { id: "deleted", kind: "upload", mediaType: "image/png", filename: "deleted.png", size: 1, createdAt: "2", url: "/deleted" };
    const survivor: AssetItem = { id: "survivor", kind: "image", mediaType: "image/png", filename: "survivor.png", size: 2, createdAt: "1", url: "/survivor" };
    const coordinator = createAssetRefreshCoordinator();
    const deletion = coordinator.begin([], [deleted.id]);
    const overlapping = coordinator.begin();

    expect(coordinator.resolve(deletion, [survivor], [survivor])?.map((asset) => asset.id)).toEqual(["survivor"]);
    expect(coordinator.resolve(overlapping, [survivor], [deleted, survivor])?.map((asset) => asset.id)).toEqual(["survivor"]);

    const authoritative = coordinator.begin();
    expect(coordinator.resolve(authoritative, [survivor], [survivor])?.map((asset) => asset.id)).toEqual(["survivor"]);
  });

  test("preserves a committed asset through overlapping stale responses until listed", () => {
    const existing: AssetItem = { id: "existing", kind: "upload", mediaType: "image/png", filename: "existing.png", size: 1, createdAt: "1", url: "/existing" };
    const committed: AssetItem = { id: "committed", kind: "image", mediaType: "image/png", filename: "committed.png", size: 2, createdAt: "2", url: "/committed" };
    const listedCommitted: AssetItem = { ...committed, url: "/listed-committed", width: 1024 };
    const coordinator = createAssetRefreshCoordinator();
    const write = coordinator.begin([committed]);
    const overlapping = coordinator.begin();

    expect(coordinator.resolve(write, [committed, existing], [existing])?.map((asset) => asset.id)).toEqual(["committed", "existing"]);
    expect(coordinator.resolve(overlapping, [committed, existing], [existing])?.map((asset) => asset.id)).toEqual(["committed", "existing"]);

    const authoritative = coordinator.begin();
    const reconciled = coordinator.resolve(authoritative, [committed, existing], [listedCommitted, existing]);
    expect(reconciled?.[0]).toEqual(listedCommitted);
  });

  test("sorts assets by type with stable secondary ordering", () => {
    const assets: AssetItem[] = [
      { id: "video-old", kind: "video", mediaType: "video/mp4", filename: "z.mp4", size: 5, createdAt: "2026-01-01T00:00:00.000Z", url: "/z" },
      { id: "upload", kind: "upload", mediaType: "image/png", filename: "a.png", size: 1, createdAt: "2026-01-04T00:00:00.000Z", url: "/a" },
      { id: "image", kind: "image", mediaType: "image/png", filename: "b.png", size: 2, createdAt: "2026-01-03T00:00:00.000Z", url: "/b" },
      { id: "video-new", kind: "video", mediaType: "video/mp4", filename: "c.mp4", size: 3, createdAt: "2026-01-02T00:00:00.000Z", url: "/c" },
    ];

    expect(sortAssets(assets, "kindAsc").map((asset) => asset.id)).toEqual(["upload", "image", "video-new", "video-old"]);
    expect(assets.map((asset) => asset.id)).toEqual(["video-old", "upload", "image", "video-new"]);
  });

  test("persists and validates the asset sort mode", () => {
    localStorage.clear();

    writeStoredAssetSortMode("kindAsc");
    expect(localStorage.getItem(ASSET_SORT_STORAGE_KEY)).toBe("kindAsc");
    expect(readStoredAssetSortMode()).toBe("kindAsc");

    localStorage.setItem(ASSET_SORT_STORAGE_KEY, "unknown");
    expect(readStoredAssetSortMode()).toBe("dateDesc");
  });

  test("labels asset sort modes for display", () => {
    expect(assetSortLabel("dateDesc")).toBe("最新优先");
    expect(assetSortLabel("kindAsc")).toBe("类型分组");
  });

  test("uses concise defaults for the chat composer", () => {
    expect(initialChatDraft()).toEqual({ content: "", selectedParentId: null });
  });

  test("builds active message branch from leaf upwards", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "问题", status: "complete" },
      { id: "a1", role: "assistant", content: "回答", status: "complete", parentId: "u1" },
      { id: "u2", role: "user", content: "追问", status: "complete", parentId: "a1" },
      { id: "a2", role: "assistant", content: "追答", status: "complete", parentId: "u2" },
    ];

    expect(buildActiveBranch(messages, "a2").map((message) => message.id)).toEqual(["u1", "a1", "u2", "a2"]);
    expect(buildActiveBranch(messages, "a1").map((message) => message.id)).toEqual(["u1", "a1"]);
  });

  test("defaults to last message when no leaf id is given", () => {
    const messages: ChatMessage[] = [
      { id: "u1", role: "user", content: "问题", status: "complete" },
      { id: "a1", role: "assistant", content: "回答", status: "complete", parentId: "u1" },
    ];

    expect(buildActiveBranch(messages).map((message) => message.id)).toEqual(["u1", "a1"]);
  });

  test("formats bytes into human readable sizes", () => {
    expect(formatBytes(0)).toBe("未知大小");
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe("1.50 GB");
  });
});
