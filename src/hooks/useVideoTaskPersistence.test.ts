import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock localStorage for the test
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

// Import after localStorage is mocked
import { useVideoTaskPersistence } from "./useVideoTaskPersistence";

const STORAGE_KEY = "cstd-design:activeVideoTask";

describe("useVideoTaskPersistence", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("starts with null when no stored task", () => {
    const { result } = renderHook(() => useVideoTaskPersistence());
    expect(result.current.task).toBeNull();
  });

  it("loads active task from localStorage on mount", () => {
    const storedTask = { id: "task-1", status: "in_progress", progress: 50 };
    storage.set(STORAGE_KEY, JSON.stringify(storedTask));
    const { result } = renderHook(() => useVideoTaskPersistence());
    expect(result.current.task).toMatchObject(storedTask);
  });

  it("ignores completed or failed tasks from storage", () => {
    storage.set(STORAGE_KEY, JSON.stringify({ id: "task-1", status: "completed", progress: 100 }));
    const { result } = renderHook(() => useVideoTaskPersistence());
    expect(result.current.task).toBeNull();
  });

  it("saves task to localStorage when updated", () => {
    const { result } = renderHook(() => useVideoTaskPersistence());
    act(() => {
      result.current.setTask({ id: "task-1", status: "in_progress", progress: 25 });
    });
    const stored = JSON.parse(storage.get(STORAGE_KEY) || "null");
    expect(stored).toMatchObject({ id: "task-1", status: "in_progress", progress: 25 });
  });

  it("adds startedAt timestamp when not present", () => {
    const { result } = renderHook(() => useVideoTaskPersistence());
    act(() => {
      result.current.setTask({ id: "task-1", status: "queued", progress: 0 });
    });
    const stored = JSON.parse(storage.get(STORAGE_KEY) || "null");
    expect(stored.startedAt).toBeDefined();
  });

  it("clearTask removes the task from storage", () => {
    storage.set(STORAGE_KEY, JSON.stringify({ id: "task-1", status: "in_progress", progress: 50 }));
    const { result } = renderHook(() => useVideoTaskPersistence());
    act(() => {
      result.current.clearTask();
    });
    expect(result.current.task).toBeNull();
    expect(storage.get(STORAGE_KEY)).toBeUndefined();
  });
});
