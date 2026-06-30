import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useVideoTaskHistory } from "./useVideoTaskHistory";

const STORAGE_KEY = "cstd-design:video-task-history";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useVideoTaskHistory", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("starts with empty history", () => {
    const { result } = renderHook(() => useVideoTaskHistory());
    expect(result.current.history).toEqual([]);
  });

  test("ignores non-array saved history instead of crashing persistence", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ id: "task1" }));

    const { result } = renderHook(() => useVideoTaskHistory());

    expect(result.current.history).toEqual([]);
    act(() => {
      result.current.add({
        id: "task1",
        prompt: "ocean reveal",
        status: "completed",
        finishedAt: "2026-06-30T00:00:00.000Z",
      });
    });
    expect(result.current.history).toHaveLength(1);
    const lastCall = localStorageMock.setItem.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe(STORAGE_KEY);
  });
});
