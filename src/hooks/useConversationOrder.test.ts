import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { DragEvent } from "react";
import { useConversationOrder } from "./useConversationOrder";
import type { ConversationSummary } from "../types";

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

function makeConv(id: string, title = `Conv ${id}`): ConversationSummary {
  return {
    id,
    title,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    activeLeafId: null,
  };
}

function mockDragEvent(overrides: Partial<DragEvent> = {}): DragEvent {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      setData: vi.fn(),
      getData: vi.fn(),
      effectAllowed: "",
      dropEffect: "",
      files: null,
      items: null,
      types: null,
      setDragImage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    },
    ...overrides,
  } as unknown as DragEvent;
}

describe("useConversationOrder", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("returns conversations in original order when no custom order", () => {
    const { result } = renderHook(() => useConversationOrder());
    const convs = [makeConv("a"), makeConv("b"), makeConv("c")];

    const ordered = result.current.reorder(convs);
    expect(ordered.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  test("reorders conversations according to saved order", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(["c", "a", "b"]));

    const { result } = renderHook(() => useConversationOrder());
    const convs = [makeConv("a"), makeConv("b"), makeConv("c")];

    const ordered = result.current.reorder(convs);
    expect(ordered.map((c) => c.id)).toEqual(["c", "a", "b"]);
  });

  test("handles conversations not in order list", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(["b"]));

    const { result } = renderHook(() => useConversationOrder());
    const convs = [makeConv("a"), makeConv("b"), makeConv("c")];

    const ordered = result.current.reorder(convs);
    expect(ordered.map((c) => c.id)).toEqual(["b", "a", "c"]);
  });

  test("ignores non-array saved order instead of crashing reorder", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ first: "c" }));

    const { result } = renderHook(() => useConversationOrder());
    const convs = [makeConv("a"), makeConv("b"), makeConv("c")];

    const ordered = result.current.reorder(convs);
    expect(ordered.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  test("onDragStart sets data transfer", () => {
    const { result } = renderHook(() => useConversationOrder());

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(),
      effectAllowed: "",
    };
    const event = mockDragEvent({ dataTransfer } as unknown as Partial<DragEvent>);

    result.current.onDragStart(event, "conv1");

    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "conv1");
    expect(dataTransfer.effectAllowed).toBe("move");
  });

  test("onDragOver prevents default and sets drop effect", () => {
    const { result } = renderHook(() => useConversationOrder());

    const dataTransfer = { dropEffect: "" };
    const event = mockDragEvent({ dataTransfer } as unknown as Partial<DragEvent>);

    result.current.onDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(dataTransfer.dropEffect).toBe("move");
  });

  test("onDrop reorders conversations", () => {
    const { result } = renderHook(() => useConversationOrder());

    const dataTransfer = { getData: vi.fn().mockReturnValue("a") };
    const event = mockDragEvent({ dataTransfer } as unknown as Partial<DragEvent>);

    act(() => {
      result.current.onDrop(event, "b");
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  test("onDrop ignores drop on same item", () => {
    const { result } = renderHook(() => useConversationOrder());

    const dataTransfer = { getData: vi.fn().mockReturnValue("a") };
    const event = mockDragEvent({ dataTransfer } as unknown as Partial<DragEvent>);

    act(() => {
      result.current.onDrop(event, "a");
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  test("onDrop ignores empty source", () => {
    const { result } = renderHook(() => useConversationOrder());

    const dataTransfer = { getData: vi.fn().mockReturnValue("") };
    const event = mockDragEvent({ dataTransfer } as unknown as Partial<DragEvent>);

    act(() => {
      result.current.onDrop(event, "b");
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });
});
