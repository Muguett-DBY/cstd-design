import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useMessageForwarding } from "./useMessageForwarding";

const STORAGE_KEY = "cstd-design:forwardedMessages";

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

describe("useMessageForwarding", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("starts with empty forwarded list", () => {
    const { result } = renderHook(() => useMessageForwarding());
    expect(result.current.getForwardedMessages()).toEqual([]);
  });

  test("logForward adds a record", () => {
    const { result } = renderHook(() => useMessageForwarding());

    act(() => {
      result.current.logForward("msg1", "Hello", "Target Conv", "conv2", "conv1", "Source Conv");
    });

    const records = result.current.getForwardedMessages();
    expect(records).toHaveLength(1);
    expect(records[0].messageId).toBe("msg1");
    expect(records[0].content).toBe("Hello");
    expect(records[0].targetConversation).toBe("Target Conv");
    expect(records[0].targetConversationId).toBe("conv2");
    expect(records[0].sourceConversationId).toBe("conv1");
    expect(records[0].sourceConversationTitle).toBe("Source Conv");
    expect(records[0].forwardedAt).toBeTruthy();
  });

  test("logForward persists to localStorage", () => {
    const { result } = renderHook(() => useMessageForwarding());

    act(() => {
      result.current.logForward("msg1", "Hello", "Target Conv", "conv2");
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
    expect(lastCall[0]).toBe(STORAGE_KEY);
    const stored = JSON.parse(lastCall[1]);
    expect(stored).toHaveLength(1);
    expect(stored[0].messageId).toBe("msg1");
  });

  test("logForward accumulates multiple records", () => {
    const { result } = renderHook(() => useMessageForwarding());

    act(() => {
      result.current.logForward("msg1", "Hello", "Target Conv", "conv2");
    });
    act(() => {
      result.current.logForward("msg2", "World", "Target Conv 2", "conv3");
    });

    expect(result.current.getForwardedMessages()).toHaveLength(2);
  });

  test("getForwardCount returns correct count", () => {
    const { result } = renderHook(() => useMessageForwarding());

    act(() => {
      result.current.logForward("msg1", "Hello", "Target Conv", "conv2");
    });
    act(() => {
      result.current.logForward("msg1", "World", "Target Conv 2", "conv3");
    });

    expect(result.current.getForwardCount("msg1")).toBe(2);
    expect(result.current.getForwardCount("msg2")).toBe(0);
  });

  test("removeForward removes by index", () => {
    const { result } = renderHook(() => useMessageForwarding());

    act(() => {
      result.current.logForward("msg1", "Hello", "Target Conv", "conv2");
    });
    act(() => {
      result.current.logForward("msg2", "World", "Target Conv 2", "conv3");
    });

    act(() => {
      result.current.removeForward(0);
    });

    const records = result.current.getForwardedMessages();
    expect(records).toHaveLength(1);
    expect(records[0].messageId).toBe("msg2");
  });

  test("removeForward persists removal to localStorage", () => {
    const { result } = renderHook(() => useMessageForwarding());

    act(() => {
      result.current.logForward("msg1", "Hello", "Target Conv", "conv2");
    });
    act(() => {
      result.current.removeForward(0);
    });

    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
    const stored = JSON.parse(lastCall[1]);
    expect(stored).toHaveLength(0);
  });

  test("getForwardedByTarget filters correctly", () => {
    const { result } = renderHook(() => useMessageForwarding());

    act(() => {
      result.current.logForward("msg1", "Hello", "Target Conv", "conv2");
    });
    act(() => {
      result.current.logForward("msg2", "World", "Target Conv 2", "conv3");
    });
    act(() => {
      result.current.logForward("msg3", "Foo", "Target Conv", "conv2");
    });

    const filtered = result.current.getForwardedByTarget("conv2");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.targetConversationId === "conv2")).toBe(true);
  });

  test("loads existing data from localStorage", () => {
    const existing = [
      { messageId: "msg1", content: "Hello", forwardedAt: "2026-01-01", targetConversation: "Target", targetConversationId: "conv2" },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(existing));

    const { result } = renderHook(() => useMessageForwarding());
    expect(result.current.getForwardedMessages()).toHaveLength(1);
    expect(result.current.getForwardedMessages()[0].messageId).toBe("msg1");
  });

  test("handles malformed localStorage gracefully", () => {
    localStorageMock.getItem.mockReturnValueOnce("not-json");

    const { result } = renderHook(() => useMessageForwarding());
    expect(result.current.getForwardedMessages()).toEqual([]);
  });

  test("logForward with threadParentId", () => {
    const { result } = renderHook(() => useMessageForwarding());

    act(() => {
      result.current.logForward("msg1", "Hello", "Target Conv", "conv2", undefined, undefined, "parent1");
    });

    expect(result.current.getForwardedMessages()[0].threadParentId).toBe("parent1");
  });
});
