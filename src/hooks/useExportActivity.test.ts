import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { EXPORT_ACTIVITY_STORAGE_KEY, useExportActivity } from "./useExportActivity";

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

describe("useExportActivity", () => {
  beforeEach(() => storage.clear());

  test("records newest export first and caps history at twenty entries", () => {
    const { result } = renderHook(() => useExportActivity());

    act(() => {
      for (let index = 0; index < 24; index++) {
        result.current.record({
          id: `export-${index}`,
          title: `导出 ${index}`,
          format: "markdown",
          count: index + 1,
          createdAt: new Date(2026, 0, index + 1).toISOString(),
        });
      }
    });

    expect(result.current.activities).toHaveLength(20);
    expect(result.current.activities[0].id).toBe("export-23");
    expect(result.current.activities.at(-1)?.id).toBe("export-4");
  });

  test("upserts by id, ignores corrupt storage, persists versioned history, and clears", () => {
    storage.set(EXPORT_ACTIVITY_STORAGE_KEY, JSON.stringify({ version: 1, activities: [{ id: 1 }] }));
    const { result } = renderHook(() => useExportActivity());

    expect(result.current.activities).toEqual([]);

    act(() => {
      result.current.record({ id: "same-export", title: "初版", format: "html", count: 2 });
      result.current.record({ id: "same-export", title: "新版", format: "pdf", count: 3 });
    });

    expect(result.current.activities).toHaveLength(1);
    expect(result.current.activities[0]).toMatchObject({ title: "新版", format: "pdf", count: 3 });
    expect(JSON.parse(storage.get(EXPORT_ACTIVITY_STORAGE_KEY) || "{}").version).toBe(1);

    act(() => result.current.clear());
    expect(result.current.activities).toEqual([]);
  });

  test("normalizes persisted filenames before exposing recent export activity", () => {
    const longFilename = ` ${"安全文件名".repeat(30)}.md `;
    storage.set(EXPORT_ACTIVITY_STORAGE_KEY, JSON.stringify({
      version: 1,
      activities: [{
        id: "export-long-filename",
        title: "长文件名",
        filename: longFilename,
        format: "markdown",
        count: 1,
        createdAt: "2026-01-01T10:00:00.000Z",
      }],
    }));

    const { result } = renderHook(() => useExportActivity());

    expect(result.current.activities[0].filename).toBe("安全文件名".repeat(30).slice(0, 128));
  });
});
