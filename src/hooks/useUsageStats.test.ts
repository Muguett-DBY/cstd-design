import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useUsageStats } from "./useUsageStats";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useUsageStats", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("uses defaults when saved events are invalid", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ messageSent: "many", events: null }));

    const { result } = renderHook(() => useUsageStats());

    expect(result.current.stats.messageSent).toBe(0);
    expect(result.current.stats.events).toEqual([]);
    act(() => {
      result.current.record("message_sent");
    });
    expect(result.current.stats.messageSent).toBe(1);
  });
});
