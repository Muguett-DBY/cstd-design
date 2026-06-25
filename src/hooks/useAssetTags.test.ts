import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useAssetTags } from "./useAssetTags";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useAssetTags", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); });

  test("starts with no tags", () => {
    const { result } = renderHook(() => useAssetTags());
    expect(result.current.getTags("asset1")).toEqual([]);
  });

  test("addTag adds a tag", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("asset1", "landscape"));
    expect(result.current.getTags("asset1")).toEqual(["landscape"]);
  });

  test("addTag normalizes to lowercase and trims", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("asset1", "  Landscape  "));
    expect(result.current.getTags("asset1")).toEqual(["landscape"]);
  });

  test("addTag ignores empty tags", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("asset1", "  "));
    expect(result.current.getTags("asset1")).toEqual([]);
  });

  test("addTag ignores duplicates", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("asset1", "landscape"));
    act(() => result.current.addTag("asset1", "landscape"));
    expect(result.current.getTags("asset1")).toEqual(["landscape"]);
  });

  test("removeTag removes a tag", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("asset1", "landscape"));
    act(() => result.current.addTag("asset1", "nature"));
    act(() => result.current.removeTag("asset1", "landscape"));
    expect(result.current.getTags("asset1")).toEqual(["nature"]);
  });

  test("removeTag deletes asset entry when last tag removed", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("asset1", "landscape"));
    act(() => result.current.removeTag("asset1", "landscape"));
    expect(result.current.tags).toEqual({});
  });

  test("allTags returns unique sorted tags", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("a1", "nature"));
    act(() => result.current.addTag("a2", "landscape"));
    act(() => result.current.addTag("a3", "nature"));
    expect(result.current.allTags()).toEqual(["landscape", "nature"]);
  });

  test("tagFrequency counts correctly", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("a1", "nature"));
    act(() => result.current.addTag("a2", "nature"));
    act(() => result.current.addTag("a3", "landscape"));
    const freq = result.current.tagFrequency();
    expect(freq.nature).toBe(2);
    expect(freq.landscape).toBe(1);
  });

  test("suggestTags suggests relevant tags", () => {
    const { result } = renderHook(() => useAssetTags());
    act(() => result.current.addTag("a1", "landscape"));
    act(() => result.current.addTag("a2", "nature"));
    const suggestions = result.current.suggestTags("beautiful landscape photo");
    expect(suggestions).toContain("landscape");
  });
});
