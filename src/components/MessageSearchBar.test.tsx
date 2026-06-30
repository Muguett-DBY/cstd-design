import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MessageSearchBar } from "./MessageSearchBar";

const SEARCH_HISTORY_KEY = "cstd-design:searchHistory";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

describe("MessageSearchBar", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  test("ignores non-array saved search history when recording a query", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ query: "bad" }));
    const onNext = vi.fn();

    render(
      <MessageSearchBar
        query="launch"
        onQueryChange={vi.fn()}
        totalResults={0}
        activeIndex={0}
        onNext={onNext}
        onPrev={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(() => {
      fireEvent.keyDown(screen.getByPlaceholderText("搜索消息内容..."), { key: "Enter" });
    }).not.toThrow();
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(SEARCH_HISTORY_KEY, JSON.stringify(["launch"]));
  });
});
