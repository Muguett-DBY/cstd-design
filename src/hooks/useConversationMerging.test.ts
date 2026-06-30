import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useConversationMerging } from "./useConversationMerging";

const STORAGE_KEY = "cstd-design:mergedConversations";

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

describe("useConversationMerging", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("starts with no merged conversations", () => {
    const { result } = renderHook(() => useConversationMerging());
    expect(result.current.isMerged("conv1")).toBe(false);
    expect(result.current.getMergeRecord("conv1")).toBeNull();
  });

  test("mergeConversations records merge", () => {
    const { result } = renderHook(() => useConversationMerging());

    act(() => {
      result.current.mergeConversations("source1", "target1");
    });

    expect(result.current.isMerged("source1")).toBe(true);
    const record = result.current.getMergeRecord("source1");
    expect(record).not.toBeNull();
    expect(record!.sourceId).toBe("source1");
    expect(record!.targetId).toBe("target1");
    expect(record!.mergedAt).toBeTruthy();
  });

  test("mergeConversations persists to localStorage", () => {
    const { result } = renderHook(() => useConversationMerging());

    act(() => {
      result.current.mergeConversations("source1", "target1");
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
    expect(lastCall[0]).toBe(STORAGE_KEY);
    const stored = JSON.parse(lastCall[1]);
    expect(stored.source1.targetId).toBe("target1");
  });

  test("unmergeConversation removes merge record", () => {
    const { result } = renderHook(() => useConversationMerging());

    act(() => {
      result.current.mergeConversations("source1", "target1");
    });
    expect(result.current.isMerged("source1")).toBe(true);

    act(() => {
      result.current.unmergeConversation("source1");
    });
    expect(result.current.isMerged("source1")).toBe(false);
    expect(result.current.getMergeRecord("source1")).toBeNull();
  });

  test("getMergedConversations filters correctly", () => {
    const { result } = renderHook(() => useConversationMerging());

    act(() => {
      result.current.mergeConversations("source1", "target1");
    });

    const merged = result.current.getMergedConversations(["source1", "source2", "source3"]);
    expect(merged).toEqual(["source1"]);
  });

  test("getUnmergedConversations filters correctly", () => {
    const { result } = renderHook(() => useConversationMerging());

    act(() => {
      result.current.mergeConversations("source1", "target1");
    });

    const unmerged = result.current.getUnmergedConversations(["source1", "source2", "source3"]);
    expect(unmerged).toEqual(["source2", "source3"]);
  });

  test("loads existing data from localStorage", () => {
    const existing = {
      source1: { sourceId: "source1", targetId: "target1", mergedAt: "2026-01-01" },
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existing));

    const { result } = renderHook(() => useConversationMerging());
    expect(result.current.isMerged("source1")).toBe(true);
    expect(result.current.getMergeRecord("source1")!.targetId).toBe("target1");
  });

  test("handles malformed localStorage gracefully", () => {
    localStorageMock.getItem.mockReturnValueOnce("not-json");

    const { result } = renderHook(() => useConversationMerging());
    expect(result.current.isMerged("conv1")).toBe(false);
  });

  test("ignores non-record saved merge state", () => {
    localStorageMock.getItem.mockReturnValueOnce("null");

    const { result } = renderHook(() => useConversationMerging());
    expect(result.current.isMerged("conv1")).toBe(false);
    expect(result.current.getMergeRecord("conv1")).toBeNull();
  });

  test("merged property exposes full state", () => {
    const { result } = renderHook(() => useConversationMerging());

    act(() => {
      result.current.mergeConversations("source1", "target1");
    });

    expect(result.current.merged.source1).toBeDefined();
    expect(result.current.merged.source1.targetId).toBe("target1");
  });
});
