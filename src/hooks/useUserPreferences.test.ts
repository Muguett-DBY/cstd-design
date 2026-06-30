import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useUserPreferences } from "./useUserPreferences";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useUserPreferences", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("uses defaults when saved nested tab labels are invalid", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ customTabLabels: null }));

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.prefs.customTabLabels.chat).toBe("");
    expect(result.current.prefs.defaultVideoFps).toBe(24);
  });
});
