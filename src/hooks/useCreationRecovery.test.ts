import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { CREATION_RECOVERY_STORAGE_KEY, useCreationRecovery } from "./useCreationRecovery";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
    length: 0,
    key: () => null,
  },
  writable: true,
  configurable: true,
});

describe("useCreationRecovery", () => {
  beforeEach(() => {
    storage.clear();
  });

  test("loads versioned records, orders newest first, and caps at twenty records", () => {
    const records = Array.from({ length: 25 }, (_, index) => ({
      id: `op-${index}`,
      type: "chat" as const,
      workspace: "chat" as const,
      label: `消息 ${index}`,
      summary: `失败 ${index}`,
      createdAt: new Date(2026, 0, index + 1).toISOString(),
      payload: { content: `hello ${index}`, parentId: null },
    }));
    storage.set(CREATION_RECOVERY_STORAGE_KEY, JSON.stringify({ version: 1, records }));

    const { result } = renderHook(() => useCreationRecovery());

    expect(result.current.records).toHaveLength(20);
    expect(result.current.records[0].id).toBe("op-24");
    expect(result.current.records.at(-1)?.id).toBe("op-5");
  });

  test("ignores stored records with invalid creation timestamps", () => {
    storage.set(CREATION_RECOVERY_STORAGE_KEY, JSON.stringify({
      version: 1,
      records: [
        {
          id: "chat-valid",
          type: "chat",
          workspace: "chat",
          label: "有效恢复",
          summary: "时间有效",
          createdAt: "2026-06-28T10:00:00.000Z",
          payload: { content: "valid", parentId: null },
        },
        {
          id: "chat-invalid",
          type: "chat",
          workspace: "chat",
          label: "坏时间恢复",
          summary: "时间无效",
          createdAt: "not-a-date",
          payload: { content: "invalid", parentId: null },
        },
      ],
    }));

    const { result } = renderHook(() => useCreationRecovery());

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].id).toBe("chat-valid");
  });

  test("ignores corrupt storage and clears invalid data on next write", () => {
    storage.set(CREATION_RECOVERY_STORAGE_KEY, "{bad json");
    const { result } = renderHook(() => useCreationRecovery());

    expect(result.current.records).toEqual([]);

    act(() => {
      result.current.upsert({
        id: "chat-1",
        type: "chat",
        workspace: "chat",
        label: "未发送消息",
        summary: "网络中断",
        payload: { content: "继续写", parentId: "parent-1" },
      });
    });

    const persisted = JSON.parse(storage.get(CREATION_RECOVERY_STORAGE_KEY) || "null");
    expect(persisted.records).toHaveLength(1);
    expect(persisted.records[0].id).toBe("chat-1");
  });

  test("upserts by operation id, dismisses individual records, and clears all", () => {
    const { result } = renderHook(() => useCreationRecovery());

    act(() => {
      result.current.upsert({
        id: "image-batch",
        type: "image",
        workspace: "image",
        label: "图片批量失败",
        summary: "1 张失败",
        payload: { prompt: "cat", style: "none", size: "1024x1024", referenceIds: [], count: 2 },
      });
      result.current.upsert({
        id: "image-batch",
        type: "image",
        workspace: "image",
        label: "图片批量失败",
        summary: "2 张失败",
        payload: { prompt: "cat", style: "none", size: "1024x1024", referenceIds: [], count: 3 },
      });
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].summary).toBe("2 张失败");

    act(() => result.current.dismiss("image-batch"));
    expect(result.current.records).toEqual([]);

    act(() => {
      result.current.upsert({
        id: "video-task",
        type: "video",
        workspace: "video",
        label: "视频生成失败",
        summary: "standard · 24fps",
        payload: { prompt: "rain", preset: "standard", fps: 24, width: 1152, height: 768, referenceAssetIds: [], keyframes: false },
      });
      result.current.clear();
    });

    expect(result.current.records).toEqual([]);
  });

  test("keeps in-memory records when storage writes fail", () => {
    const originalSetItem = globalThis.localStorage.setItem;
    globalThis.localStorage.setItem = () => {
      throw new Error("quota exceeded");
    };

    try {
      const { result } = renderHook(() => useCreationRecovery());

      act(() => {
        result.current.upsert({
          id: "chat-quota",
          type: "chat",
          workspace: "chat",
          label: "未发送消息",
          summary: "存储已满",
          payload: { content: "保留在内存里", parentId: null },
        });
      });

      expect(result.current.records).toHaveLength(1);
      expect(result.current.records[0].id).toBe("chat-quota");
    } finally {
      globalThis.localStorage.setItem = originalSetItem;
    }
  });
});
