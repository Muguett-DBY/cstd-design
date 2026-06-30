import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useVideoPresets } from "./useVideoPresets";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useVideoPresets", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); });

  test("loads seed presets by default", () => {
    const { result } = renderHook(() => useVideoPresets());
    expect(result.current.presets.length).toBeGreaterThanOrEqual(5);
  });

  test("seed presets have required fields", () => {
    const { result } = renderHook(() => useVideoPresets());
    for (const preset of result.current.presets) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.prompt).toBeTruthy();
      expect(preset.preset).toBeTruthy();
      expect(preset.fps).toBeGreaterThan(0);
    }
  });

  test("add adds a custom preset", () => {
    const { result } = renderHook(() => useVideoPresets());
    const initialCount = result.current.presets.length;
    act(() => result.current.add({
      name: "Custom",
      description: "Test",
      prompt: "Test prompt",
      preset: "standard",
      fps: 24,
      aspectRatio: "1280x720",
    }));
    expect(result.current.presets.length).toBe(initialCount + 1);
    expect(result.current.presets[0].name).toBe("Custom");
  });

  test("remove removes a preset", () => {
    const { result } = renderHook(() => useVideoPresets());
    const initialCount = result.current.presets.length;
    const id = result.current.presets[0].id;
    act(() => result.current.remove(id));
    expect(result.current.presets.length).toBe(initialCount - 1);
  });

  test("loads from localStorage when available", () => {
    const customPresets = [{ id: "c1", name: "Saved", description: "", prompt: "", preset: "standard", fps: 24, aspectRatio: "1280x720" }];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(customPresets));
    const { result } = renderHook(() => useVideoPresets());
    expect(result.current.presets[0].name).toBe("Saved");
  });

  test("falls back to seed presets when saved presets are incomplete", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([{ id: "bad" }]));

    const { result } = renderHook(() => useVideoPresets());

    expect(result.current.presets.length).toBeGreaterThanOrEqual(5);
    expect(result.current.presets.every((preset) => preset.name && preset.prompt)).toBe(true);
  });
});
