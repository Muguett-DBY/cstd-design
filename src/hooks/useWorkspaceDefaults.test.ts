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

import { useWorkspaceDefaults } from "./useWorkspaceDefaults";

const STORAGE_KEY = "cstd-design:workspace-defaults";

describe("useWorkspaceDefaults", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("returns empty defaults when no stored data", () => {
    const { result } = renderHook(() => useWorkspaceDefaults());
    expect(result.current.getDefaults("image")).toEqual({});
    expect(result.current.getDefaults("chat")).toEqual({});
  });

  it("loads defaults from localStorage", () => {
    storage.set(STORAGE_KEY, JSON.stringify({ image: { size: "1024x1024" } }));
    const { result } = renderHook(() => useWorkspaceDefaults());
    expect(result.current.getDefaults("image")).toEqual({ size: "1024x1024" });
  });

  it("sets a default value", () => {
    const { result } = renderHook(() => useWorkspaceDefaults());
    act(() => {
      result.current.setDefault("image", "size", "1024x1024");
    });
    expect(result.current.getDefaults("image")).toEqual({ size: "1024x1024" });
  });

  it("saves to localStorage", () => {
    const { result } = renderHook(() => useWorkspaceDefaults());
    act(() => {
      result.current.setDefault("image", "size", "1024x1024");
    });
    const stored = JSON.parse(storage.get(STORAGE_KEY) || "{}");
    expect(stored.image.size).toBe("1024x1024");
  });

  it("clears defaults for a workspace", () => {
    const { result } = renderHook(() => useWorkspaceDefaults());
    act(() => {
      result.current.setDefault("image", "size", "1024x1024");
    });
    act(() => {
      result.current.clearDefaults("image");
    });
    expect(result.current.getDefaults("image")).toEqual({});
  });

  it("clears only the specified workspace", () => {
    const { result } = renderHook(() => useWorkspaceDefaults());
    act(() => {
      result.current.setDefault("image", "size", "1024x1024");
      result.current.setDefault("chat", "theme", "dark");
    });
    act(() => {
      result.current.clearDefaults("image");
    });
    expect(result.current.getDefaults("image")).toEqual({});
    expect(result.current.getDefaults("chat")).toEqual({ theme: "dark" });
  });

  it("supports multiple keys per workspace", () => {
    const { result } = renderHook(() => useWorkspaceDefaults());
    act(() => {
      result.current.setDefault("image", "size", "1024x1024");
      result.current.setDefault("image", "style", "anime");
    });
    const defaults = result.current.getDefaults("image");
    expect(defaults.size).toBe("1024x1024");
    expect(defaults.style).toBe("anime");
  });
});
