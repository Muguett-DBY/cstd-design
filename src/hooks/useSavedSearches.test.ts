import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useSavedSearches } from "./useSavedSearches";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useSavedSearches", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); });

  test("starts with no saved searches", () => {
    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.saved).toEqual([]);
  });

  test("add adds a saved search", () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => result.current.add({ name: "My Search", query: "test", roleFilter: "all", dateFilter: "all" }));
    expect(result.current.saved).toHaveLength(1);
    expect(result.current.saved[0].name).toBe("My Search");
    expect(result.current.saved[0].query).toBe("test");
  });

  test("add limits to 20 entries", () => {
    const { result } = renderHook(() => useSavedSearches());
    for (let i = 0; i < 25; i++) {
      act(() => result.current.add({ name: `Search ${i}`, query: `q${i}`, roleFilter: "all", dateFilter: "all" }));
    }
    expect(result.current.saved.length).toBeLessThanOrEqual(20);
  });

  test("remove removes a saved search", () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => result.current.add({ name: "Search", query: "test", roleFilter: "all", dateFilter: "all" }));
    const id = result.current.saved[0].id;
    act(() => result.current.remove(id));
    expect(result.current.saved).toHaveLength(0);
  });

  test("persists to localStorage", () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => result.current.add({ name: "Test", query: "q", roleFilter: "user", dateFilter: "week" }));
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});
