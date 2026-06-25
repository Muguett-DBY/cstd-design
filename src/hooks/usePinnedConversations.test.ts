import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { usePinnedConversations, partitionPinned } from "./usePinnedConversations";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("usePinnedConversations", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("starts with no pinned conversations", () => {
    const { result } = renderHook(() => usePinnedConversations());
    expect(result.current.isPinned("conv1")).toBe(false);
  });

  test("toggle pins an unpinned conversation", () => {
    const { result } = renderHook(() => usePinnedConversations());

    act(() => { result.current.toggle("conv1"); });

    expect(result.current.isPinned("conv1")).toBe(true);
  });

  test("toggle unpins a pinned conversation", () => {
    const { result } = renderHook(() => usePinnedConversations());

    act(() => { result.current.toggle("conv1"); });
    expect(result.current.isPinned("conv1")).toBe(true);

    act(() => { result.current.toggle("conv1"); });
    expect(result.current.isPinned("conv1")).toBe(false);
  });

  test("allPinned returns true when all IDs are pinned", () => {
    const { result } = renderHook(() => usePinnedConversations());

    act(() => { result.current.bulkPin(["conv1", "conv2"]); });

    expect(result.current.allPinned(["conv1", "conv2"])).toBe(true);
    expect(result.current.allPinned(["conv1", "conv3"])).toBe(false);
  });

  test("allPinned returns false for empty array", () => {
    const { result } = renderHook(() => usePinnedConversations());
    expect(result.current.allPinned([])).toBe(false);
  });

  test("bulkPin pins multiple conversations", () => {
    const { result } = renderHook(() => usePinnedConversations());

    act(() => { result.current.bulkPin(["conv1", "conv2", "conv3"]); });

    expect(result.current.isPinned("conv1")).toBe(true);
    expect(result.current.isPinned("conv2")).toBe(true);
    expect(result.current.isPinned("conv3")).toBe(true);
  });

  test("bulkUnpin unpins multiple conversations", () => {
    const { result } = renderHook(() => usePinnedConversations());

    act(() => { result.current.bulkPin(["conv1", "conv2", "conv3"]); });
    act(() => { result.current.bulkUnpin(["conv1", "conv3"]); });

    expect(result.current.isPinned("conv1")).toBe(false);
    expect(result.current.isPinned("conv2")).toBe(true);
    expect(result.current.isPinned("conv3")).toBe(false);
  });

  test("pinned Set is exposed", () => {
    const { result } = renderHook(() => usePinnedConversations());

    act(() => { result.current.toggle("conv1"); });

    expect(result.current.pinned).toBeInstanceOf(Set);
    expect(result.current.pinned.has("conv1")).toBe(true);
  });

  test("loads existing data from localStorage", () => {
    const existing = ["conv1", "conv2"];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existing));

    const { result } = renderHook(() => usePinnedConversations());
    expect(result.current.isPinned("conv1")).toBe(true);
    expect(result.current.isPinned("conv2")).toBe(true);
    expect(result.current.isPinned("conv3")).toBe(false);
  });

  test("handles malformed localStorage gracefully", () => {
    localStorageMock.getItem.mockReturnValueOnce("not-json");

    const { result } = renderHook(() => usePinnedConversations());
    expect(result.current.isPinned("conv1")).toBe(false);
  });
});

describe("partitionPinned", () => {
  test("partitions items into pinned and other", () => {
    const items = [
      { id: "a", name: "Item A" },
      { id: "b", name: "Item B" },
      { id: "c", name: "Item C" },
    ];
    const pinned = new Set(["a", "c"]);

    const { pinnedItems, otherItems } = partitionPinned(items, pinned);

    expect(pinnedItems.map((i) => i.id)).toEqual(["a", "c"]);
    expect(otherItems.map((i) => i.id)).toEqual(["b"]);
  });

  test("returns all items as other when none pinned", () => {
    const items = [{ id: "a" }, { id: "b" }];
    const pinned = new Set<string>();

    const { pinnedItems, otherItems } = partitionPinned(items, pinned);

    expect(pinnedItems).toEqual([]);
    expect(otherItems.map((i) => i.id)).toEqual(["a", "b"]);
  });

  test("returns all items as pinned when all pinned", () => {
    const items = [{ id: "a" }, { id: "b" }];
    const pinned = new Set(["a", "b"]);

    const { pinnedItems, otherItems } = partitionPinned(items, pinned);

    expect(pinnedItems.map((i) => i.id)).toEqual(["a", "b"]);
    expect(otherItems).toEqual([]);
  });
});
