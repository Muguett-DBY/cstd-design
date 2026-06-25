import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useDraftPersistence } from "./useDraftPersistence";

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

describe("useDraftPersistence", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); localStorageMock.removeItem.mockClear(); });

  test("starts with empty draft when no conversation", () => {
    const { result } = renderHook(() => useDraftPersistence(null));
    expect(result.current.draft.content).toBe("");
    expect(result.current.draft.selectedParentId).toBeNull();
  });

  test("setDraft updates draft content", () => {
    const { result } = renderHook(() => useDraftPersistence("conv1"));
    act(() => result.current.setDraft({ content: "Hello", selectedParentId: null }));
    expect(result.current.draft.content).toBe("Hello");
  });

  test("setDraft with function updater", () => {
    const { result } = renderHook(() => useDraftPersistence("conv1"));
    act(() => result.current.setDraft({ content: "Hello", selectedParentId: null }));
    act(() => result.current.setDraft((prev) => ({ ...prev, content: prev.content + " World" })));
    expect(result.current.draft.content).toBe("Hello World");
  });

  test("clearDraft resets to empty", () => {
    const { result } = renderHook(() => useDraftPersistence("conv1"));
    act(() => result.current.setDraft({ content: "Hello", selectedParentId: "p1" }));
    act(() => result.current.clearDraft());
    expect(result.current.draft.content).toBe("");
    expect(result.current.draft.selectedParentId).toBeNull();
  });

  test("loads draft from localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ content: "Saved draft", selectedParentId: "p1" }));
    const { result } = renderHook(() => useDraftPersistence("conv1"));
    expect(result.current.draft.content).toBe("Saved draft");
    expect(result.current.draft.selectedParentId).toBe("p1");
  });
});
