import { describe, expect, test, vi } from "vitest";
import indexHtml from "../index.html?raw";

function themeBootstrapScript() {
  const match = indexHtml.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error("theme bootstrap script not found");
  return match[1];
}

describe("theme bootstrap script", () => {
  test("does not throw when localStorage is unavailable", () => {
    const add = vi.fn();
    const run = new Function("document", "globalThis", themeBootstrapScript());

    expect(() => run(
      { documentElement: { classList: { add } } },
      { matchMedia: () => ({ matches: false }) },
    )).not.toThrow();
    expect(add).not.toHaveBeenCalled();
  });

  test("applies dark theme when stored preference is true", () => {
    const add = vi.fn();
    const run = new Function("document", "globalThis", themeBootstrapScript());

    run(
      { documentElement: { classList: { add } } },
      {
        localStorage: { getItem: () => "true" },
        matchMedia: () => ({ matches: false }),
      },
    );

    expect(add).toHaveBeenCalledWith("theme-dark");
  });
});
