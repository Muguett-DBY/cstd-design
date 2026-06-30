import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useVideoTaskQueue } from "./useVideoTaskQueue";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useVideoTaskQueue", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("ignores saved queue entries missing required fields", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([{ status: "queued" }]));

    const { result } = renderHook(() => useVideoTaskQueue());

    expect(result.current.tasks).toEqual([]);
    act(() => {
      result.current.addTask("ocean reveal", "task1");
    });
    expect(result.current.tasks[0]).toMatchObject({ id: "task1", prompt: "ocean reveal" });
  });
});
