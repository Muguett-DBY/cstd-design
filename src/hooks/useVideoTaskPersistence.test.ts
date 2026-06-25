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

  it("ignores completed tasks but retains failed tasks for recovery", () => {
    storage.set(STORAGE_KEY, JSON.stringify({ id: "task-1", status: "completed", progress: 100 }));
    const { result } = renderHook(() => useVideoTaskPersistence());
    expect(result.current.task).toBeNull();

    storage.set(STORAGE_KEY, JSON.stringify({
      id: "task-2",
      status: "failed",
      progress: 40,
      recipe: { prompt: "cinematic rain", preset: "short", fps: 24, width: 1152, height: 768, referenceAssetIds: [], keyframes: false },
    }));
    const failed = renderHook(() => useVideoTaskPersistence());
    expect(failed.result.current.task?.recipe?.prompt).toBe("cinematic rain");
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

  it("persists the full generation recipe", () => {
    const { result } = renderHook(() => useVideoTaskPersistence());
    act(() => {
      result.current.setTask({
        id: "task-recipe",
        status: "queued",
        progress: 0,
        recipe: {
          prompt: "ocean sunrise",
          preset: "standard",
          fps: 30,
          width: 1152,
          height: 768,
          referenceAssetIds: ["asset-1"],
          keyframes: true,
          negativePrompt: "blur",
          seed: 42,
        },
      });
    });
    expect(JSON.parse(storage.get(STORAGE_KEY) || "null").recipe).toMatchObject({
      prompt: "ocean sunrise",
      fps: 30,
      seed: 42,
    });
  });
});
