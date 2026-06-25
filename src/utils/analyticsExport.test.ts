import { describe, expect, test } from "vitest";
import { collectAnalytics, exportAsCSV, exportAsJSON } from "./analyticsExport";
import type { AssetItem, ChatMessage, ConversationSummary } from "../types";

function makeConv(id: string): ConversationSummary {
  return {
    id,
    title: `Conv ${id}`,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    activeLeafId: null,
  };
}

function makeMsg(id: string, createdAt: string): ChatMessage {
  return {
    id,
    role: "user",
    content: "Hello",
    status: "complete",
    createdAt,
  };
}

function makeAsset(id: string, kind: string, size: number): AssetItem {
  return {
    id,
    kind: kind as "image" | "video",
    mediaType: `image/${kind}`,
    url: `/assets/${id}`,
    filename: `${id}.png`,
    size,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

describe("collectAnalytics", () => {
  test("counts conversations, messages, and assets", () => {
    const convs = [makeConv("1"), makeConv("2")];
    const msgs = [makeMsg("1", "2026-06-25T10:00:00Z"), makeMsg("2", "2026-06-25T11:00:00Z")];
    const assets = [makeAsset("1", "image", 1000), makeAsset("2", "video", 2000)];

    const data = collectAnalytics(convs, msgs, assets);
    expect(data.conversations).toBe(2);
    expect(data.messages).toBe(2);
    expect(data.assets).toBe(2);
    expect(data.images).toBe(1);
    expect(data.videos).toBe(1);
    expect(data.totalSize).toBe(3000);
  });

  test("groups messages by day", () => {
    const msgs = [
      makeMsg("1", "2026-06-25T10:00:00Z"),
      makeMsg("2", "2026-06-25T11:00:00Z"),
      makeMsg("3", "2026-06-26T10:00:00Z"),
    ];

    const data = collectAnalytics([], msgs, []);
    expect(data.messagesByDay).toHaveLength(2);
    expect(data.messagesByDay[0]).toEqual({ date: "2026-06-25", count: 2 });
    expect(data.messagesByDay[1]).toEqual({ date: "2026-06-26", count: 1 });
  });

  test("groups assets by kind", () => {
    const assets = [
      makeAsset("1", "image", 1000),
      makeAsset("2", "image", 2000),
      makeAsset("3", "video", 3000),
    ];

    const data = collectAnalytics([], [], assets);
    expect(data.assetsByKind).toHaveLength(2);
  });

  test("handles empty data", () => {
    const data = collectAnalytics([], [], []);
    expect(data.conversations).toBe(0);
    expect(data.messages).toBe(0);
    expect(data.assets).toBe(0);
    expect(data.messagesByDay).toEqual([]);
    expect(data.assetsByKind).toEqual([]);
  });
});

describe("exportAsCSV", () => {
  test("generates valid CSV", () => {
    const data = collectAnalytics(
      [makeConv("1")],
      [makeMsg("1", "2026-06-25T10:00:00Z")],
      [makeAsset("1", "image", 1000)]
    );

    const csv = exportAsCSV(data);
    expect(csv).toContain("Metric,Value");
    expect(csv).toContain("Conversations,1");
    expect(csv).toContain("Messages,1");
    expect(csv).toContain("Date,Message Count");
    expect(csv).toContain("Kind,Count,Size (bytes)");
  });
});

describe("exportAsJSON", () => {
  test("generates valid JSON", () => {
    const data = collectAnalytics([], [], []);
    const json = exportAsJSON(data);
    const parsed = JSON.parse(json);
    expect(parsed.conversations).toBe(0);
  });
});
