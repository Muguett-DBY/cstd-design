import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { CREATION_ACTIVITY_STORAGE_KEY, useCreationActivity } from "./useCreationActivity";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    length: 0,
    key: () => null,
  },
  configurable: true,
});

describe("useCreationActivity", () => {
  beforeEach(() => storage.clear());

  test("records newest activity first and caps history at thirty entries", () => {
    const { result } = renderHook(() => useCreationActivity());

    act(() => {
      for (let index = 0; index < 35; index++) {
        result.current.record({
          id: `activity-${index}`,
          type: "restored",
          workspace: "chat",
          label: `恢复 ${index}`,
          createdAt: new Date(2026, 0, index + 1).toISOString(),
        });
      }
    });

    expect(result.current.activities).toHaveLength(30);
    expect(result.current.activities[0].id).toBe("activity-34");
    expect(result.current.activities.at(-1)?.id).toBe("activity-5");
  });

  test("upserts by id, persists versioned history, and clears explicitly", () => {
    const { result } = renderHook(() => useCreationActivity());

    act(() => {
      result.current.record({ id: "recovery-1", type: "restored", workspace: "image", label: "恢复图片" });
      result.current.record({ id: "recovery-1", type: "completed", workspace: "image", label: "图片恢复完成" });
    });

    expect(result.current.activities).toHaveLength(1);
    expect(result.current.activities[0].type).toBe("completed");
    expect(JSON.parse(storage.get(CREATION_ACTIVITY_STORAGE_KEY) || "{}").version).toBe(1);

    act(() => result.current.clear());
    expect(result.current.activities).toEqual([]);
  });
});
