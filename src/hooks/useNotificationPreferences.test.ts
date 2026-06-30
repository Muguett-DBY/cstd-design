import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useNotificationPreferences } from "./useNotificationPreferences";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useNotificationPreferences", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("uses default preferences when saved nested types are invalid", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ enabled: true, types: null }));

    const { result } = renderHook(() => useNotificationPreferences());

    expect(result.current.shouldNotify("message")).toBe(true);
    act(() => {
      result.current.setTypeEnabled("message", false);
    });
    expect(result.current.shouldNotify("message")).toBe(false);
  });
});
