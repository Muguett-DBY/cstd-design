import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Sidebar } from "./Sidebar";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  },
  configurable: true,
});

function renderSidebar(onSearch: (query: string) => void) {
  return render(
    <Sidebar
      activeTab="chat"
      onTabChange={vi.fn()}
      conversations={[]}
      activeConversationId={null}
      onSearch={onSearch}
      onSelectConversation={vi.fn()}
      onCreateConversation={vi.fn()}
      onDeleteConversation={vi.fn()}
      onRequestConfirm={vi.fn()}
      dark={false}
      onThemeToggle={vi.fn()}
      onLogout={vi.fn()}
    />,
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test("searches only after the query changes and uses the latest callback", () => {
    const firstSearch = vi.fn();
    const secondSearch = vi.fn();
    const view = renderSidebar(firstSearch);

    act(() => vi.advanceTimersByTime(200));
    expect(firstSearch).not.toHaveBeenCalled();

    view.rerender(
      <Sidebar
        activeTab="chat"
        onTabChange={vi.fn()}
        conversations={[]}
        activeConversationId={null}
        onSearch={secondSearch}
        onSelectConversation={vi.fn()}
        onCreateConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
        onRequestConfirm={vi.fn()}
        dark={false}
        onThemeToggle={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    act(() => vi.advanceTimersByTime(200));
    expect(secondSearch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("搜索会话..."), { target: { value: "roadmap" } });
    act(() => vi.advanceTimersByTime(200));
    expect(secondSearch).toHaveBeenCalledOnce();
    expect(secondSearch).toHaveBeenCalledWith("roadmap");
  });
});
