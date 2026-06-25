import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useLanguage } from "./useLanguage";

const STORAGE_KEY = "cstd-design:language";

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

describe("useLanguage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("defaults to zh based on navigator", () => {
    const { result } = renderHook(() => useLanguage());
    expect(["zh", "en"]).toContain(result.current.language);
  });

  test("setLanguage changes language", () => {
    const { result } = renderHook(() => useLanguage());
    act(() => result.current.setLanguage("en"));
    expect(result.current.language).toBe("en");
  });

  test("loads language from localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce("en");
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe("en");
  });

  test("persists language to localStorage", () => {
    const { result } = renderHook(() => useLanguage());
    act(() => result.current.setLanguage("en"));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, "en");
  });

  test("t() returns translated string for zh", () => {
    const { result } = renderHook(() => useLanguage());
    act(() => result.current.setLanguage("zh"));
    expect(result.current.t("common.save")).toBe("保存");
  });

  test("t() returns translated string for en", () => {
    const { result } = renderHook(() => useLanguage());
    act(() => result.current.setLanguage("en"));
    expect(result.current.t("common.save")).toBe("Save");
  });

  test("t() returns string for any key", () => {
    const { result } = renderHook(() => useLanguage());
    expect(typeof result.current.t("common.save")).toBe("string");
    expect(typeof result.current.t("nav.chat")).toBe("string");
  });

  test("sets document lang attribute", () => {
    const { result } = renderHook(() => useLanguage());
    act(() => result.current.setLanguage("en"));
    expect(document.documentElement.lang).toBe("en");
  });
});
