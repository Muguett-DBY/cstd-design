import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useChatPromptTemplates } from "./useChatPromptTemplates";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useChatPromptTemplates", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("falls back to seed templates when saved templates are incomplete", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([{ id: "bad" }]));

    const { result } = renderHook(() => useChatPromptTemplates());

    expect(result.current.templates.length).toBeGreaterThanOrEqual(3);
    expect(result.current.templates.every((template) => template.name && template.prompt)).toBe(true);
  });
});
