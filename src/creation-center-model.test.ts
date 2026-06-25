import { describe, expect, test } from "vitest";
import { deriveCreationCenterHighlights } from "./creation-center-model";
import type { AssetItem, ConversationSummary } from "./types";
import type { VideoTaskHistoryEntry } from "./hooks/useVideoTaskHistory";

describe("deriveCreationCenterHighlights", () => {
  test("selects the latest conversation and generated image without mutating inputs", () => {
    const conversations: ConversationSummary[] = [
      { id: "older", title: "旧对话", activeLeafId: null, createdAt: "2026-06-25T01:00:00.000Z", updatedAt: "2026-06-25T02:00:00.000Z" },
      { id: "latest", title: "最新对话", activeLeafId: null, createdAt: "2026-06-26T01:00:00.000Z", updatedAt: "2026-06-26T04:00:00.000Z" },
    ];
    const assets: AssetItem[] = [
      { id: "upload", kind: "upload", mediaType: "image/png", filename: "upload.png", size: 1, createdAt: "2026-06-26T05:00:00.000Z", url: "/upload.png" },
      { id: "generated-old", kind: "image", mediaType: "image/png", filename: "old.png", size: 1, createdAt: "2026-06-25T05:00:00.000Z", url: "/old.png" },
      { id: "generated-new", kind: "image", mediaType: "image/png", filename: "new.png", size: 1, createdAt: "2026-06-26T03:00:00.000Z", url: "/new.png" },
    ];
    const originalConversationOrder = conversations.map((item) => item.id);
    const originalAssetOrder = assets.map((item) => item.id);

    const result = deriveCreationCenterHighlights({ conversations, assets, videoHistory: [] });

    expect(result.latestConversation?.id).toBe("latest");
    expect(result.latestImage?.id).toBe("generated-new");
    expect(conversations.map((item) => item.id)).toEqual(originalConversationOrder);
    expect(assets.map((item) => item.id)).toEqual(originalAssetOrder);
  });

  test("counts only completed video results and treats invalid dates as oldest", () => {
    const videoHistory: VideoTaskHistoryEntry[] = [
      { id: "failed", prompt: "失败任务", status: "failed", finishedAt: "2026-06-26T05:00:00.000Z" },
      { id: "invalid", prompt: "无效时间", status: "completed", finishedAt: "not-a-date" },
      { id: "completed", prompt: "完成任务", status: "completed", finishedAt: "2026-06-26T04:00:00.000Z" },
    ];

    const result = deriveCreationCenterHighlights({ conversations: [], assets: [], videoHistory });

    expect(result.completedVideoTasks.map((item) => item.id)).toEqual(["completed", "invalid"]);
  });
});
