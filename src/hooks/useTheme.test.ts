import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useTheme, THEMES } from "./useTheme";

const STORAGE_KEY = "cstd-design:theme";

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

describe("useTheme", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.className = "";
  });

  test("has 6 themes defined", () => {
    expect(THEMES).toHaveLength(6);
  });

  test("each theme has required properties", () => {
    for (const theme of THEMES) {
      expect(theme.id).toBeTruthy();
      expect(theme.label).toBeTruthy();
      expect(theme.description).toBeTruthy();
    }
  });

  test("defaults to light theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  test("setTheme changes theme", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
  });

  test("loads theme from localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce("ocean");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("ocean");
  });

  test("persists theme to localStorage", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("forest"));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, "forest");
  });

  test("setAutoMode toggles auto mode", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.autoMode).toBe(false);
    act(() => result.current.setAutoMode(true));
    expect(result.current.autoMode).toBe(true);
    act(() => result.current.setAutoMode(false));
    expect(result.current.autoMode).toBe(false);
  });
});
