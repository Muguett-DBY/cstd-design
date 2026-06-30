import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useCollections } from "./useCollections";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useCollections", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); });

  test("starts with no collections", () => {
    const { result } = renderHook(() => useCollections());
    expect(result.current.collections).toEqual([]);
  });

  test("ignores saved collections missing required fields", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([{ id: "bad", name: "Bad" }]));

    const { result } = renderHook(() => useCollections());

    expect(result.current.collections).toEqual([]);
    expect(result.current.filterByCollection(["asset1"], "bad")).toEqual(["asset1"]);
  });

  test("create adds a collection", () => {
    const { result } = renderHook(() => useCollections());
    act(() => { result.current.create("Favorites"); });
    expect(result.current.collections).toHaveLength(1);
    expect(result.current.collections[0].name).toBe("Favorites");
    expect(result.current.collections[0].assetIds).toEqual([]);
  });

  test("create returns null for empty name", () => {
    const { result } = renderHook(() => useCollections());
    let col: ReturnType<typeof result.current.create>;
    act(() => { col = result.current.create("  "); });
    expect(col!).toBeNull();
    expect(result.current.collections).toHaveLength(0);
  });

  test("remove deletes a collection", () => {
    const { result } = renderHook(() => useCollections());
    let col: ReturnType<typeof result.current.create>;
    act(() => { col = result.current.create("Test"); });
    act(() => result.current.remove(col!.id));
    expect(result.current.collections).toHaveLength(0);
  });

  test("update modifies a collection", () => {
    const { result } = renderHook(() => useCollections());
    let col: ReturnType<typeof result.current.create>;
    act(() => { col = result.current.create("Old Name"); });
    act(() => result.current.update(col!.id, { name: "New Name" }));
    expect(result.current.collections[0].name).toBe("New Name");
  });

  test("addAsset adds an asset to collection", () => {
    const { result } = renderHook(() => useCollections());
    let col: ReturnType<typeof result.current.create>;
    act(() => { col = result.current.create("Test"); });
    act(() => result.current.addAsset(col!.id, "asset1"));
    expect(result.current.collections[0].assetIds).toEqual(["asset1"]);
  });

  test("addAsset ignores duplicates", () => {
    const { result } = renderHook(() => useCollections());
    let col: ReturnType<typeof result.current.create>;
    act(() => { col = result.current.create("Test"); });
    act(() => result.current.addAsset(col!.id, "asset1"));
    act(() => result.current.addAsset(col!.id, "asset1"));
    expect(result.current.collections[0].assetIds).toEqual(["asset1"]);
  });

  test("removeAsset removes an asset from collection", () => {
    const { result } = renderHook(() => useCollections());
    let col: ReturnType<typeof result.current.create>;
    act(() => { col = result.current.create("Test"); });
    act(() => result.current.addAsset(col!.id, "asset1"));
    act(() => result.current.addAsset(col!.id, "asset2"));
    act(() => result.current.removeAsset(col!.id, "asset1"));
    expect(result.current.collections[0].assetIds).toEqual(["asset2"]);
  });

  test("getAssetCollections returns collections containing asset", () => {
    const { result } = renderHook(() => useCollections());
    let col1: ReturnType<typeof result.current.create>;
    let col2: ReturnType<typeof result.current.create>;
    act(() => { col1 = result.current.create("Col 1"); });
    act(() => { col2 = result.current.create("Col 2"); });
    act(() => result.current.addAsset(col1!.id, "asset1"));
    act(() => result.current.addAsset(col2!.id, "asset1"));
    const cols = result.current.getAssetCollections("asset1");
    expect(cols).toHaveLength(2);
  });

  test("filterByCollection filters correctly", () => {
    const { result } = renderHook(() => useCollections());
    let col: ReturnType<typeof result.current.create>;
    act(() => { col = result.current.create("Test"); });
    act(() => result.current.addAsset(col!.id, "a1"));
    act(() => result.current.addAsset(col!.id, "a3"));
    const filtered = result.current.filterByCollection(["a1", "a2", "a3"], col!.id);
    expect(filtered).toEqual(["a1", "a3"]);
  });

  test("filterByCollection returns all when no collection", () => {
    const { result } = renderHook(() => useCollections());
    const filtered = result.current.filterByCollection(["a1", "a2"], null);
    expect(filtered).toEqual(["a1", "a2"]);
  });
});
