import { describe, expect, test } from "vitest";
import { appendChatEvent, buildActiveBranch, filterAssets, formatBytes, initialChatDraft, videoPresetToRequest } from "./app-state";
import type { AssetItem, ChatMessage } from "./types";

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
