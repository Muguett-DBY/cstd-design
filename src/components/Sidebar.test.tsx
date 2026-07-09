import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ConversationSummary } from "../types";
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

function conversation(id: string, title: string): ConversationSummary {
  return {
    id,
    title,
    activeLeafId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    messageCount: 1,
    lastMessage: `${title} last message`,
  };
}

function renderSidebar({
  conversations = [],
  onRequestConfirm = vi.fn(),
  onSearch = vi.fn(),
}: {
  conversations?: ConversationSummary[];
  onRequestConfirm?: (title: string, message: string, danger: boolean, onConfirm: () => void) => void;
  onSearch?: (query: string) => void;
} = {}) {
  return render(
    <Sidebar
      activeTab="chat"
      onTabChange={vi.fn()}
      conversations={conversations}
      activeConversationId={null}
      onSearch={onSearch}
      onSelectConversation={vi.fn()}
      onCreateConversation={vi.fn()}
      onDeleteConversation={vi.fn()}
      onRequestConfirm={onRequestConfirm}
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
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("searches only after the query changes and uses the latest callback", () => {
    const firstSearch = vi.fn();
    const secondSearch = vi.fn();
    const view = renderSidebar({ onSearch: firstSearch });

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

  test("routes conversation merge through the app confirmation dialog", () => {
    const onRequestConfirm = vi.fn();
    const nativeConfirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderSidebar({
      conversations: [
        conversation("source", "源会话"),
        conversation("target", "目标会话"),
      ],
      onRequestConfirm,
    });

    fireEvent.change(screen.getAllByDisplayValue("合并")[0], { target: { value: "target" } });

    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(onRequestConfirm).toHaveBeenCalledOnce();
    const [title, message, danger, onConfirm] = onRequestConfirm.mock.calls[0];
    expect(title).toBe("合并会话");
    expect(message).toContain("源会话");
    expect(message).toContain("目标会话");
    expect(danger).toBe(false);
    expect(localStorage.getItem("cstd-design:mergedConversations")).toBeNull();

    act(() => onConfirm());

    const merged = JSON.parse(localStorage.getItem("cstd-design:mergedConversations") || "{}");
    expect(merged.source.targetId).toBe("target");
  });
});
