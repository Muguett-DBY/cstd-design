import { describe, expect, test } from "vitest";
import {
  appendChatEvent,
  buildActiveBranch,
  filterAssets,
  formatBytes,
  initialChatDraft,
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
