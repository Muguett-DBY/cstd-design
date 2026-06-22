import { describe, it, expect, beforeEach } from "vitest";
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

import { useCustomShortcuts } from "./useCustomShortcuts";

const STORAGE_KEY = "cstd-design:custom-shortcuts";

describe("useCustomShortcuts", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("returns default shortcuts when no custom shortcuts stored", () => {
    const { result } = renderHook(() => useCustomShortcuts());
    expect(result.current.shortcuts.commandPalette).toBe("Mod+k");
    expect(result.current.shortcuts.send).toBe("Enter");
    expect(result.current.shortcuts.focusInput).toBe("Mod+/");
  });

  it("loads custom shortcuts from localStorage", () => {
    storage.set(STORAGE_KEY, JSON.stringify({ commandPalette: "Mod+Shift+k" }));
    const { result } = renderHook(() => useCustomShortcuts());
    expect(result.current.shortcuts.commandPalette).toBe("Mod+Shift+k");
    expect(result.current.shortcuts.send).toBe("Enter");
  });

  it("updates a shortcut", () => {
    const { result } = renderHook(() => useCustomShortcuts());
    act(() => {
      result.current.updateShortcut("commandPalette", "Mod+Shift+k");
    });
    expect(result.current.shortcuts.commandPalette).toBe("Mod+Shift+k");
  });

  it("saves updated shortcut to localStorage", () => {
    const { result } = renderHook(() => useCustomShortcuts());
    act(() => {
      result.current.updateShortcut("commandPalette", "Mod+Shift+k");
    });
    const stored = JSON.parse(storage.get(STORAGE_KEY) || "{}");
    expect(stored.commandPalette).toBe("Mod+Shift+k");
  });

  it("resets shortcuts to defaults", () => {
    const { result } = renderHook(() => useCustomShortcuts());
    act(() => {
      result.current.updateShortcut("commandPalette", "Mod+Shift+k");
    });
    act(() => {
      result.current.resetShortcuts();
    });
    expect(result.current.shortcuts.commandPalette).toBe("Mod+k");
  });

  it("provides labels for all actions", () => {
    const { result } = renderHook(() => useCustomShortcuts());
    expect(result.current.labels.commandPalette).toBe("命令面板");
    expect(result.current.labels.send).toBe("发送消息");
    expect(result.current.labels.focusInput).toBe("聚焦输入框");
  });

  it("formats shortcuts with platform-specific keys", () => {
    const { result } = renderHook(() => useCustomShortcuts());
    const formatted = result.current.format("commandPalette");
    expect(formatted).toMatch(/Ctrl|⌘/);
    expect(formatted).toContain("k");
  });
});
