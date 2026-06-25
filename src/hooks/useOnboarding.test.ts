import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useOnboarding } from "./useOnboarding";

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

describe("useOnboarding", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); localStorageMock.removeItem.mockClear(); });

  test("has 5 onboarding steps", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.steps).toHaveLength(5);
  });

  test("starts with first step", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.currentStep?.id).toBe("welcome");
    expect(result.current.isComplete).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  test("completeStep advances to next step", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.completeStep("welcome"));
    expect(result.current.currentStep?.id).toBe("chat");
    expect(result.current.progress).toBe(0.2);
  });

  test("skipAll marks all steps complete", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.skipAll());
    expect(result.current.isComplete).toBe(true);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.progress).toBe(1);
  });

  test("resetOnboarding resets progress", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.completeStep("welcome"));
    act(() => result.current.resetOnboarding());
    expect(result.current.currentStep?.id).toBe("welcome");
    expect(result.current.isComplete).toBe(false);
  });

  test("loads completed steps from localStorage", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(["welcome", "chat"]));
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.currentStep?.id).toBe("image");
    expect(result.current.progress).toBe(0.4);
  });
});
