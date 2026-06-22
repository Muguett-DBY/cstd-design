import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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

import { useAssetVersions } from "./useAssetVersions";

const STORAGE_KEY = "cstd-design:asset-versions";

describe("useAssetVersions", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("starts with empty versions when no stored data", () => {
    const { result } = renderHook(() => useAssetVersions());
    expect(result.current.getVersions("asset-1")).toEqual([]);
    expect(result.current.getLatestVersion("asset-1")).toBeNull();
  });

  it("loads versions from localStorage on mount", () => {
    const stored = [
      { id: "v1", assetId: "asset-1", timestamp: "2026-01-01T00:00:00Z", changes: {}, description: "test" },
    ];
    storage.set(STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useAssetVersions());
    expect(result.current.getVersions("asset-1")).toHaveLength(1);
  });

  it("records a new version", () => {
    const { result } = renderHook(() => useAssetVersions());
    act(() => {
      result.current.recordVersion("asset-1", { tag: "test" }, "Added tag");
    });
    const versions = result.current.getVersions("asset-1");
    expect(versions).toHaveLength(1);
    expect(versions[0].assetId).toBe("asset-1");
    expect(versions[0].description).toBe("Added tag");
    expect(versions[0].changes).toEqual({ tag: "test" });
  });

  it("limits versions per asset to 10", () => {
    const { result } = renderHook(() => useAssetVersions());
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.recordVersion("asset-1", { i }, `Version ${i}`);
      }
    });
    expect(result.current.getVersions("asset-1")).toHaveLength(10);
  });

  it("gets latest version", () => {
    const { result } = renderHook(() => useAssetVersions());
    act(() => {
      result.current.recordVersion("asset-1", {}, "First");
    });
    act(() => {
      result.current.recordVersion("asset-1", {}, "Second");
    });
    const latest = result.current.getLatestVersion("asset-1");
    expect(latest).not.toBeNull();
    expect(latest!.description).toBe("Second");
  });

  it("returns null for non-existent asset", () => {
    const { result } = renderHook(() => useAssetVersions());
    expect(result.current.getLatestVersion("nonexistent")).toBeNull();
    expect(result.current.getVersions("nonexistent")).toEqual([]);
  });

  it("saves to localStorage", () => {
    const { result } = renderHook(() => useAssetVersions());
    act(() => {
      result.current.recordVersion("asset-1", { tag: "test" }, "test");
    });
    const stored = JSON.parse(storage.get(STORAGE_KEY) || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].assetId).toBe("asset-1");
  });

  it("sorts versions by timestamp descending", () => {
    const { result } = renderHook(() => useAssetVersions());
    act(() => {
      result.current.recordVersion("asset-1", {}, "First");
    });
    // Wait to ensure different timestamps
    const start = Date.now();
    while (Date.now() - start < 10) { /* busy wait */ }
    act(() => {
      result.current.recordVersion("asset-1", {}, "Second");
    });
    const versions = result.current.getVersions("asset-1");
    expect(versions[0].description).toBe("Second");
    expect(versions[1].description).toBe("First");
  });
});
