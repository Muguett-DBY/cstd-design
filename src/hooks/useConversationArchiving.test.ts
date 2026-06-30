import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useConversationArchiving } from "./useConversationArchiving";

const STORAGE_KEY = "cstd-design:archivedConversations";

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

describe("useConversationArchiving", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("starts with no archived conversations", () => {
    const { result } = renderHook(() => useConversationArchiving());
    expect(result.current.isArchived("conv1")).toBe(false);
  });

  test("toggleArchive archives an unarchived conversation", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.toggleArchive("conv1");
    });

    expect(result.current.isArchived("conv1")).toBe(true);
  });

  test("toggleArchive unarchives an archived conversation", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.toggleArchive("conv1");
    });
    expect(result.current.isArchived("conv1")).toBe(true);

    act(() => {
      result.current.toggleArchive("conv1");
    });
    expect(result.current.isArchived("conv1")).toBe(false);
  });

  test("archiveConversation sets archived to true", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.archiveConversation("conv1");
    });

    expect(result.current.isArchived("conv1")).toBe(true);
  });

  test("unarchiveConversation sets archived to false", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.archiveConversation("conv1");
    });
    expect(result.current.isArchived("conv1")).toBe(true);

    act(() => {
      result.current.unarchiveConversation("conv1");
    });
    expect(result.current.isArchived("conv1")).toBe(false);
  });

  test("getArchivedConversations filters correctly", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.archiveConversation("conv1");
    });
    act(() => {
      result.current.archiveConversation("conv3");
    });

    const archived = result.current.getArchivedConversations(["conv1", "conv2", "conv3"]);
    expect(archived).toEqual(["conv1", "conv3"]);
  });

  test("getUnarchivedConversations filters correctly", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.archiveConversation("conv1");
    });

    const unarchived = result.current.getUnarchivedConversations(["conv1", "conv2", "conv3"]);
    expect(unarchived).toEqual(["conv2", "conv3"]);
  });

  test("bulkArchive archives multiple conversations", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.bulkArchive(["conv1", "conv2", "conv3"]);
    });

    expect(result.current.isArchived("conv1")).toBe(true);
    expect(result.current.isArchived("conv2")).toBe(true);
    expect(result.current.isArchived("conv3")).toBe(true);
  });

  test("bulkUnarchive unarchives multiple conversations", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.bulkArchive(["conv1", "conv2", "conv3"]);
    });

    act(() => {
      result.current.bulkUnarchive(["conv1", "conv3"]);
    });

    expect(result.current.isArchived("conv1")).toBe(false);
    expect(result.current.isArchived("conv2")).toBe(true);
    expect(result.current.isArchived("conv3")).toBe(false);
  });

  test("persists to localStorage", () => {
    const { result } = renderHook(() => useConversationArchiving());

    act(() => {
      result.current.archiveConversation("conv1");
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
    expect(lastCall[0]).toBe(STORAGE_KEY);
    const stored = JSON.parse(lastCall[1]);
    expect(stored.conv1).toBe(true);
  });

  test("loads existing data from localStorage", () => {
    const existing = { conv1: true, conv2: false };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existing));

    const { result } = renderHook(() => useConversationArchiving());
    expect(result.current.isArchived("conv1")).toBe(true);
    expect(result.current.isArchived("conv2")).toBe(false);
  });

  test("handles malformed localStorage gracefully", () => {
    localStorageMock.getItem.mockReturnValueOnce("not-json");

    const { result } = renderHook(() => useConversationArchiving());
    expect(result.current.isArchived("conv1")).toBe(false);
  });

  test("ignores non-record saved archive state", () => {
    localStorageMock.getItem.mockReturnValueOnce("null");

    const { result } = renderHook(() => useConversationArchiving());
    expect(result.current.isArchived("conv1")).toBe(false);
  });
});
