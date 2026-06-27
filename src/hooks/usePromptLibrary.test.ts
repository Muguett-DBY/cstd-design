import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { usePromptLibrary } from "./usePromptLibrary";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("usePromptLibrary", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); });

  test("loads seed prompts by default", () => {
    const { result } = renderHook(() => usePromptLibrary());
    expect(result.current.prompts.length).toBeGreaterThan(0);
  });

  test("addPrompt adds a custom prompt", () => {
    const { result } = renderHook(() => usePromptLibrary());
    const initialCount = result.current.prompts.length;
    act(() => result.current.addPrompt("Test prompt", "custom"));
    expect(result.current.prompts.length).toBe(initialCount + 1);
  });

  test("removePrompt removes a custom prompt", () => {
    const { result } = renderHook(() => usePromptLibrary());
    act(() => result.current.addPrompt("To remove", "custom"));
    const id = result.current.prompts[result.current.prompts.length - 1].id;
    act(() => result.current.removePrompt(id));
    expect(result.current.prompts.find((p) => p.id === id)).toBeUndefined();
  });

  test("toggleFavorite toggles favorite status", () => {
    const { result } = renderHook(() => usePromptLibrary());
    act(() => result.current.addPrompt("Test", "custom"));
    const id = result.current.prompts[result.current.prompts.length - 1].id;
    expect(result.current.prompts.find((p) => p.id === id)?.isFavorite).toBe(false);
    act(() => result.current.toggleFavorite(id));
    expect(result.current.prompts.find((p) => p.id === id)?.isFavorite).toBe(true);
  });

  test("recordUsage updates useCount and lastUsedAt", () => {
    const { result } = renderHook(() => usePromptLibrary());
    act(() => result.current.addPrompt("Test", "custom"));
    const id = result.current.prompts[result.current.prompts.length - 1].id;
    act(() => result.current.recordUsage(id));
    const updated = result.current.prompts.find((p) => p.id === id);
    expect(updated?.useCount).toBe(1);
    expect(updated?.lastUsedAt).not.toBeNull();
  });

  test("getRecentlyUsed returns prompts with lastUsedAt set", () => {
    const { result } = renderHook(() => usePromptLibrary());
    act(() => result.current.addPrompt("Recent Test Prompt", "custom"));
    const newId = result.current.prompts[result.current.prompts.length - 1].id;
    act(() => result.current.recordUsage(newId));
    const recent = result.current.getRecentlyUsed(10);
    const found = recent.find((p) => p.text === "Recent Test Prompt");
    expect(found).toBeDefined();
    expect(found?.lastUsedAt).not.toBeNull();
  });

  test("getRecentlyUsed returns most recent first", () => {
    const { result } = renderHook(() => usePromptLibrary());
    act(() => result.current.addPrompt("First Prompt", "custom"));
    const firstId = result.current.prompts[result.current.prompts.length - 1].id;
    act(() => result.current.recordUsage(firstId));
    act(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.now() + 1000));
    });
    act(() => result.current.addPrompt("Second Prompt", "custom"));
    const secondId = result.current.prompts[result.current.prompts.length - 1].id;
    act(() => result.current.recordUsage(secondId));
    act(() => { vi.useRealTimers(); });
    const recent = result.current.getRecentlyUsed(5);
    const firstIdx = recent.findIndex((p) => p.text === "First Prompt");
    const secondIdx = recent.findIndex((p) => p.text === "Second Prompt");
    expect(secondIdx).toBeGreaterThanOrEqual(0);
    expect(firstIdx).toBeGreaterThanOrEqual(0);
    if (firstIdx >= 0 && secondIdx >= 0) {
      expect(secondIdx).toBeLessThan(firstIdx);
    }
  });

  test("getFavorites returns only favorites", () => {
    const { result } = renderHook(() => usePromptLibrary());
    act(() => result.current.addPrompt("Fav", "custom"));
    const id = result.current.prompts[result.current.prompts.length - 1].id;
    act(() => result.current.toggleFavorite(id));
    const favorites = result.current.getFavorites();
    expect(favorites.find((p) => p.id === id)).toBeDefined();
  });

  test("getMostUsed returns prompts sorted by useCount", () => {
    const { result } = renderHook(() => usePromptLibrary());
    act(() => result.current.addPrompt("A", "custom"));
    act(() => result.current.addPrompt("B", "custom"));
    const aId = result.current.prompts[result.current.prompts.length - 2].id;
    const bId = result.current.prompts[result.current.prompts.length - 1].id;
    act(() => { result.current.recordUsage(aId); result.current.recordUsage(aId); });
    act(() => { result.current.recordUsage(bId); });
    const mostUsed = result.current.getMostUsed(5);
    expect(mostUsed[0]?.id).toBe(aId);
  });
});
