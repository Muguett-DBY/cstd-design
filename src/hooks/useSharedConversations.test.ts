import { beforeEach, describe, expect, test, vi } from "vitest";
import { createShareLink, getSharedConversation, listShared } from "./useSharedConversations";

const STORAGE_KEY = "cstd-design:shared-conversations";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("useSharedConversations storage helpers", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("ignores non-record saved shared conversation state", () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(null));

    expect(listShared()).toEqual([]);
    expect(getSharedConversation("missing")).toBeNull();
  });

  test("creates a share link after invalid saved state", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(null));

    const shared = createShareLink("Test", [{ role: "user", content: "hello" }]);

    expect(shared.title).toBe("Test");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining(shared.token),
    );
  });
});
