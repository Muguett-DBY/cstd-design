import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAssetDeduplication } from "./useAssetDeduplication";
import type { AssetItem } from "../types";

function makeAsset(overrides: Partial<AssetItem> = {}): AssetItem {
  return {
    id: overrides.id || "asset-1",
    url: overrides.url || "https://example.com/file.png",
    filename: overrides.filename || "file.png",
    kind: overrides.kind || "image",
    mediaType: overrides.mediaType || "image/png",
    size: overrides.size || 1024,
    createdAt: overrides.createdAt || "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("useAssetDeduplication", () => {
  it("starts with empty duplicates", () => {
    const { result } = renderHook(() => useAssetDeduplication());
    expect(result.current.duplicates).toEqual([]);
  });

  it("detects duplicate filenames", () => {
    const { result } = renderHook(() => useAssetDeduplication());
    const assets = [
      makeAsset({ id: "1", filename: "photo.png" }),
      makeAsset({ id: "2", filename: "photo.png" }),
    ];
    act(() => {
      const found = result.current.scanForDuplicates(assets);
      expect(found).toHaveLength(1);
      expect(found[0].reason).toContain("photo.png");
      expect(found[0].assets).toHaveLength(2);
    });
  });

  it("detects duplicate file sizes", () => {
    const { result } = renderHook(() => useAssetDeduplication());
    const assets = [
      makeAsset({ id: "1", filename: "a.png", size: 1024 }),
      makeAsset({ id: "2", filename: "b.png", size: 1024 }),
    ];
    act(() => {
      const found = result.current.scanForDuplicates(assets);
      expect(found).toHaveLength(1);
      expect(found[0].reason).toContain("1.0KB");
    });
  });

  it("does not double-count when filename and size both match", () => {
    const { result } = renderHook(() => useAssetDeduplication());
    const assets = [
      makeAsset({ id: "1", filename: "photo.png", size: 1024 }),
      makeAsset({ id: "2", filename: "photo.png", size: 1024 }),
    ];
    act(() => {
      const found = result.current.scanForDuplicates(assets);
      expect(found).toHaveLength(1);
    });
  });

  it("returns empty for unique assets", () => {
    const { result } = renderHook(() => useAssetDeduplication());
    const assets = [
      makeAsset({ id: "1", filename: "a.png", size: 100 }),
      makeAsset({ id: "2", filename: "b.png", size: 200 }),
      makeAsset({ id: "3", filename: "c.png", size: 300 }),
    ];
    act(() => {
      const found = result.current.scanForDuplicates(assets);
      expect(found).toHaveLength(0);
    });
  });

  it("returns empty for single asset", () => {
    const { result } = renderHook(() => useAssetDeduplication());
    const assets = [makeAsset({ id: "1", filename: "solo.png" })];
    act(() => {
      const found = result.current.scanForDuplicates(assets);
      expect(found).toHaveLength(0);
    });
  });

  it("detects multiple duplicate groups", () => {
    const { result } = renderHook(() => useAssetDeduplication());
    const assets = [
      makeAsset({ id: "1", filename: "a.png", size: 100 }),
      makeAsset({ id: "2", filename: "a.png", size: 100 }),
      makeAsset({ id: "3", filename: "b.png", size: 200 }),
      makeAsset({ id: "4", filename: "b.png", size: 200 }),
    ];
    act(() => {
      const found = result.current.scanForDuplicates(assets);
      expect(found).toHaveLength(2);
    });
  });

  it("case-insensitive filename comparison", () => {
    const { result } = renderHook(() => useAssetDeduplication());
    const assets = [
      makeAsset({ id: "1", filename: "Photo.PNG" }),
      makeAsset({ id: "2", filename: "photo.png" }),
    ];
    act(() => {
      const found = result.current.scanForDuplicates(assets);
      expect(found).toHaveLength(1);
    });
  });
});
