import { describe, expect, test } from "vitest";
import { appendChatEvent, filterAssets, initialChatDraft, videoPresetToRequest } from "./app-state";
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

  test("filters assets by module type while preserving all on empty filter", () => {
    const assets: AssetItem[] = [
      { id: "1", kind: "upload", mediaType: "image/png", filename: "a.png", size: 1, createdAt: "1", url: "/a" },
      { id: "2", kind: "image", mediaType: "image/png", filename: "b.png", size: 1, createdAt: "2", url: "/b" },
      { id: "3", kind: "video", mediaType: "video/mp4", filename: "c.mp4", size: 1, createdAt: "3", url: "/c" },
    ];

    expect(filterAssets(assets, "image").map((asset) => asset.id)).toEqual(["1", "2"]);
    expect(filterAssets(assets, "video").map((asset) => asset.id)).toEqual(["3"]);
    expect(filterAssets(assets, "all").map((asset) => asset.id)).toEqual(["1", "2", "3"]);
  });

  test("uses concise defaults for the chat composer", () => {
    expect(initialChatDraft()).toEqual({ content: "", selectedParentId: null });
  });
});
