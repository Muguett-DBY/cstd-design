import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
    length: 0,
    key: () => null,
  },
  writable: true,
  configurable: true,
});

import { usePromptHistory, usePromptSuggestions } from "./usePromptHistory";

const STORAGE_KEY = "cstd-design:prompt-history";

describe("usePromptHistory", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("starts with empty history when no stored data", () => {
    const { result } = renderHook(() => usePromptHistory());
    expect(result.current.history).toEqual([]);
  });

  it("loads history from localStorage on mount", () => {
    const stored = [{ text: "test prompt", count: 3, lastUsed: Date.now() }];
    storage.set(STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => usePromptHistory());
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe("test prompt");
  });

  it("records a new prompt", () => {
    const { result } = renderHook(() => usePromptHistory());
    act(() => {
      result.current.recordPrompt("hello world");
    });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe("hello world");
    expect(result.current.history[0].count).toBe(1);
  });

  it("increments count for existing prompt", () => {
    const { result } = renderHook(() => usePromptHistory());
    act(() => {
      result.current.recordPrompt("hello world");
    });
    act(() => {
      result.current.recordPrompt("hello world");
    });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].count).toBe(2);
  });

  it("ignores prompts shorter than 2 characters", () => {
    const { result } = renderHook(() => usePromptHistory());
    act(() => {
      result.current.recordPrompt("a");
    });
    expect(result.current.history).toHaveLength(0);
  });

  it("trims whitespace from prompts", () => {
    const { result } = renderHook(() => usePromptHistory());
    act(() => {
      result.current.recordPrompt("  hello  ");
    });
    expect(result.current.history[0].text).toBe("hello");
  });

  it("saves to localStorage", () => {
    const { result } = renderHook(() => usePromptHistory());
    act(() => {
      result.current.recordPrompt("test");
    });
    const stored = JSON.parse(storage.get(STORAGE_KEY) || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe("test");
  });

  it("sorts by count descending", () => {
    const { result } = renderHook(() => usePromptHistory());
    act(() => {
      result.current.recordPrompt("rare prompt");
    });
    act(() => {
      result.current.recordPrompt("common prompt");
    });
    act(() => {
      result.current.recordPrompt("common prompt");
    });
    act(() => {
      result.current.recordPrompt("common prompt");
    });
    expect(result.current.history[0].text).toBe("common prompt");
    expect(result.current.history[1].text).toBe("rare prompt");
  });
});

describe("usePromptSuggestions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    return () => vi.useRealTimers();
  });

  it("returns empty for empty text", () => {
    const history = [{ text: "hello world", count: 1, lastUsed: Date.now() }];
    const { result } = renderHook(() => usePromptSuggestions("", history));
    expect(result.current).toEqual([]);
  });

  it("returns matching suggestions", () => {
    const history = [
      { text: "hello world", count: 1, lastUsed: Date.now() },
      { text: "goodbye world", count: 1, lastUsed: Date.now() },
    ];
    const { result } = renderHook(() => usePromptSuggestions("hello", history));
    vi.advanceTimersByTime(200);
    expect(result.current).toContain("hello world");
  });

  it("excludes exact match from suggestions", () => {
    const history = [{ text: "hello", count: 1, lastUsed: Date.now() }];
    const { result } = renderHook(() => usePromptSuggestions("hello", history));
    vi.advanceTimersByTime(200);
    expect(result.current).not.toContain("hello");
  });

  it("respects limit parameter", () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      text: `prompt ${i} test`,
      count: 1,
      lastUsed: Date.now(),
    }));
    const { result } = renderHook(() => usePromptSuggestions("test", history, 2));
    vi.advanceTimersByTime(200);
    expect(result.current.length).toBeLessThanOrEqual(2);
  });
});
