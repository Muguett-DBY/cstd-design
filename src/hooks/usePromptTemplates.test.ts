import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { usePromptTemplates, expandVariables, AVAILABLE_VARIABLES } from "./usePromptTemplates";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("expandVariables", () => {
  test("expands {{date}} variable", () => {
    const result = expandVariables("Today is {{date}}");
    expect(result).toMatch(/^Today is \d{4}-\d{2}-\d{2}$/);
  });

  test("expands {{time}} variable", () => {
    const result = expandVariables("Time: {{time}}");
    expect(result).toMatch(/^Time: \d{2}:\d{2}$/);
  });

  test("expands custom variables", () => {
    const result = expandVariables("Hello {{name}}", { name: "World" });
    expect(result).toBe("Hello World");
  });

  test("leaves unknown variables unchanged", () => {
    const result = expandVariables("Hello {{unknown}}");
    expect(result).toBe("Hello {{unknown}}");
  });
});

describe("usePromptTemplates", () => {
  beforeEach(() => { localStorageMock.clear(); localStorageMock.getItem.mockClear(); localStorageMock.setItem.mockClear(); });

  test("has available variables defined", () => {
    expect(AVAILABLE_VARIABLES.length).toBeGreaterThan(0);
  });

  test("starts with no templates", () => {
    const { result } = renderHook(() => usePromptTemplates());
    expect(result.current.templates).toEqual([]);
  });

  test("save adds a template", () => {
    const { result } = renderHook(() => usePromptTemplates());
    act(() => result.current.save("My Template", "Generate a {{date}} image"));
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].name).toBe("My Template");
  });

  test("remove removes a template", () => {
    const { result } = renderHook(() => usePromptTemplates());
    act(() => result.current.save("Template 1", "prompt 1"));
    const id = result.current.templates[0].id;
    act(() => result.current.remove(id));
    expect(result.current.templates).toHaveLength(0);
  });

  test("persists to localStorage", () => {
    const { result } = renderHook(() => usePromptTemplates());
    act(() => result.current.save("Test", "prompt"));
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});
