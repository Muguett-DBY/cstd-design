import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useAssetMetadataEdit } from "./useAssetMetadataEdit";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useAssetMetadataEdit", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); });

  test("returns empty metadata for unknown asset", () => {
    const { result } = renderHook(() => useAssetMetadataEdit());
    expect(result.current.getMetadata("unknown")).toEqual({ title: "", description: "", tags: [] });
  });

  test("ignores non-record saved metadata", () => {
    localStorageMock.getItem.mockReturnValueOnce("null");

    const { result } = renderHook(() => useAssetMetadataEdit());

    expect(result.current.getMetadata("unknown")).toEqual({ title: "", description: "", tags: [] });
  });

  test("setTitle sets title", () => {
    const { result } = renderHook(() => useAssetMetadataEdit());
    act(() => result.current.setTitle("a1", "My Image"));
    expect(result.current.getMetadata("a1").title).toBe("My Image");
  });

  test("setDescription sets description", () => {
    const { result } = renderHook(() => useAssetMetadataEdit());
    act(() => result.current.setDescription("a1", "A beautiful landscape"));
    expect(result.current.getMetadata("a1").description).toBe("A beautiful landscape");
  });

  test("addTag adds a tag", () => {
    const { result } = renderHook(() => useAssetMetadataEdit());
    act(() => result.current.addTag("a1", "nature"));
    expect(result.current.getMetadata("a1").tags).toEqual(["nature"]);
  });

  test("addTag ignores duplicates", () => {
    const { result } = renderHook(() => useAssetMetadataEdit());
    act(() => result.current.addTag("a1", "nature"));
    act(() => result.current.addTag("a1", "nature"));
    expect(result.current.getMetadata("a1").tags).toEqual(["nature"]);
  });

  test("removeTag removes a tag", () => {
    const { result } = renderHook(() => useAssetMetadataEdit());
    act(() => result.current.addTag("a1", "nature"));
    act(() => result.current.addTag("a1", "landscape"));
    act(() => result.current.removeTag("a1", "nature"));
    expect(result.current.getMetadata("a1").tags).toEqual(["landscape"]);
  });

  test("persists to localStorage", () => {
    const { result } = renderHook(() => useAssetMetadataEdit());
    act(() => result.current.setTitle("a1", "Test"));
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});
