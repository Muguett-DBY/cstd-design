import { afterEach, describe, expect, test, vi } from "vitest";
import { clearAppCaches, hasCachedAppShell } from "./useServiceWorker";

describe("clearAppCaches", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("removes only this app's caches", async () => {
    const deleteCache = vi.fn(async (name: string) => name.length > 0);
    vi.stubGlobal("caches", {
      keys: vi.fn(async () => [
        "cstd-design-static-v1",
        "cstd-design-dynamic-v1",
        "unrelated-cache",
      ]),
      delete: deleteCache,
    });

    await clearAppCaches();

    expect(deleteCache.mock.calls.map(([name]) => name).sort()).toEqual([
      "cstd-design-dynamic-v1",
      "cstd-design-static-v1",
    ]);
  });
});

describe("hasCachedAppShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reports readiness only when the current app shell is actually cached", async () => {
    const match = vi
      .fn()
      .mockResolvedValueOnce(new Response("shell"))
      .mockResolvedValueOnce(undefined);
    vi.stubGlobal("caches", { match });

    expect(await hasCachedAppShell()).toBe(true);
    expect(await hasCachedAppShell()).toBe(false);
    expect(match).toHaveBeenCalledWith("/", { cacheName: "cstd-design-static-v2" });
  });
});
