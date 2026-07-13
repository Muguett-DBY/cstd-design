import { afterEach, describe, expect, test, vi } from "vitest";
import { api, onUnauthorized } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function unauthorizedResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

describe("API unauthorized responses", () => {
  test("preserves an incorrect-password message without broadcasting session expiry", async () => {
    const unauthorizedHandler = vi.fn();
    const removeUnauthorizedHandler = onUnauthorized(unauthorizedHandler);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(unauthorizedResponse("密码不正确。")));

    try {
      await expect(api.login("incorrect-password")).rejects.toThrow("密码不正确。");
      expect(unauthorizedHandler).not.toHaveBeenCalled();
    } finally {
      removeUnauthorizedHandler();
    }
  });

  test("keeps broadcasting session expiry for protected-resource unauthorized responses", async () => {
    const unauthorizedHandler = vi.fn();
    const removeUnauthorizedHandler = onUnauthorized(unauthorizedHandler);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(unauthorizedResponse("后端细节不应暴露。")));

    try {
      await expect(api.conversations()).rejects.toThrow("请先登录。");
      expect(unauthorizedHandler).toHaveBeenCalledOnce();
    } finally {
      removeUnauthorizedHandler();
    }
  });
});

describe("asset list requests", () => {
  test("bypasses browser caches after asset writes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ assets: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.assets()).resolves.toEqual({ assets: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
