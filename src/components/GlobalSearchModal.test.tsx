import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GlobalSearchModal } from "./GlobalSearchModal";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  },
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => cleanup());

describe("GlobalSearchModal", () => {
  test("routes an active conversation message result to the exact message", () => {
    const onSelectConversation = vi.fn();
    const onSelectMessage = vi.fn();
    const props = {
      open: true,
      onClose: vi.fn(),
      conversations: [
        {
          id: "first-conversation",
          title: "First conversation",
          activeLeafId: null,
          createdAt: "2026-06-29T00:00:00.000Z",
          updatedAt: "2026-06-29T00:00:00.000Z",
          messageCount: 1,
        },
        {
          id: "active-conversation",
          title: "Launch planning",
          activeLeafId: "target-message",
          createdAt: "2026-06-30T00:00:00.000Z",
          updatedAt: "2026-06-30T00:00:00.000Z",
          messageCount: 1,
        },
      ],
      activeConversationId: "active-conversation",
      activeMessages: [
        {
          id: "target-message",
          role: "assistant" as const,
          content: "Launch checklist is ready",
          status: "complete" as const,
        },
      ],
      assets: [],
      onSelectConversation,
      onSelectMessage,
      onSelectAsset: vi.fn(),
    };

    render(<GlobalSearchModal {...props} />);
    fireEvent.change(screen.getByRole("textbox", { name: "全局搜索" }), {
      target: { value: "checklist" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Launch checklist is ready/ }));

    expect(onSelectMessage).toHaveBeenCalledWith(
      "active-conversation",
      "target-message",
      "checklist",
    );
    expect(onSelectConversation).not.toHaveBeenCalled();
  });

  test("routes tag and collection results to asset library filters", () => {
    localStorage.setItem("cstd-design:asset-tags", JSON.stringify({
      "asset-1": ["launch"],
    }));
    localStorage.setItem("cstd-design:asset-collections", JSON.stringify([
      {
        id: "collection-1",
        name: "Launch Board",
        assetIds: ["asset-1"],
        createdAt: "2026-06-30T00:00:00.000Z",
      },
    ]));

    const onSelectTag = vi.fn();
    const onSelectCollection = vi.fn();
    const props = {
      open: true,
      onClose: vi.fn(),
      conversations: [],
      activeMessages: [],
      assets: [
        {
          id: "asset-1",
          kind: "image" as const,
          mediaType: "image/png",
          filename: "brief.png",
          size: 1024,
          createdAt: "2026-06-30T00:00:00.000Z",
          url: "/brief.png",
        },
      ],
      onSelectConversation: vi.fn(),
      onSelectAsset: vi.fn(),
      onSelectTag,
      onSelectCollection,
    };

    const { rerender } = render(<GlobalSearchModal {...props} />);
    fireEvent.change(screen.getByRole("textbox", { name: "全局搜索" }), {
      target: { value: "launch" },
    });
    fireEvent.click(screen.getByRole("button", { name: /#launch/ }));
    expect(onSelectTag).toHaveBeenCalledWith("launch");

    props.onClose.mockClear();
    rerender(<GlobalSearchModal {...props} />);
    fireEvent.change(screen.getByRole("textbox", { name: "全局搜索" }), {
      target: { value: "board" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Launch Board/ }));
    expect(onSelectCollection).toHaveBeenCalledWith("collection-1", "Launch Board");
  });

  test("shows result count and keyboard position feedback", () => {
    const props = {
      open: true,
      onClose: vi.fn(),
      conversations: [
        {
          id: "conversation-1",
          title: "Launch plan",
          activeLeafId: null,
          createdAt: "2026-06-30T00:00:00.000Z",
          updatedAt: "2026-06-30T00:00:00.000Z",
          messageCount: 3,
        },
      ],
      activeMessages: [],
      assets: [
        {
          id: "asset-1",
          kind: "image" as const,
          mediaType: "image/png",
          filename: "launch.png",
          size: 1024,
          createdAt: "2026-06-30T00:00:00.000Z",
          url: "/launch.png",
        },
      ],
      onSelectConversation: vi.fn(),
      onSelectAsset: vi.fn(),
    };

    render(<GlobalSearchModal {...props} />);
    const input = screen.getByRole("textbox", { name: "全局搜索" });
    fireEvent.change(input, { target: { value: "launch" } });

    expect(screen.getByText("共 2 个结果")).toBeTruthy();
    expect(screen.getByText("当前 1/2")).toBeTruthy();
    expect(screen.getByText("↑↓ 选择")).toBeTruthy();
    expect(screen.getByText("Enter 打开")).toBeTruthy();

    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(screen.getByText("当前 2/2")).toBeTruthy();
    expect(screen.getByRole("button", { name: /launch.png/ }).getAttribute("aria-current")).toBe("true");
  });

  test("saves and reapplies a global search query", () => {
    const props = {
      open: true,
      onClose: vi.fn(),
      conversations: [
        {
          id: "conversation-1",
          title: "Launch plan",
          activeLeafId: null,
          createdAt: "2026-06-30T00:00:00.000Z",
          updatedAt: "2026-06-30T00:00:00.000Z",
          messageCount: 3,
        },
      ],
      activeMessages: [],
      assets: [],
      onSelectConversation: vi.fn(),
      onSelectAsset: vi.fn(),
    };

    render(<GlobalSearchModal {...props} />);
    const input = screen.getByRole("textbox", { name: "全局搜索" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "launch" } });
    fireEvent.click(screen.getByRole("button", { name: "保存本次搜索" }));

    const saved = JSON.parse(localStorage.getItem("cstd-design:saved-searches") || "[]");
    expect(saved[0].query).toBe("launch");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "使用已保存搜索：launch" }));

    expect(input.value).toBe("launch");
    expect(screen.getByText("共 1 个结果")).toBeTruthy();
  });

  test("removes a saved global search from the empty state", () => {
    const props = {
      open: true,
      onClose: vi.fn(),
      conversations: [],
      activeMessages: [],
      assets: [],
      onSelectConversation: vi.fn(),
      onSelectAsset: vi.fn(),
    };

    render(<GlobalSearchModal {...props} />);
    const input = screen.getByRole("textbox", { name: "全局搜索" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "launch" } });
    fireEvent.click(screen.getByRole("button", { name: "保存本次搜索" }));
    fireEvent.change(input, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "删除已保存搜索：launch" }));

    expect(screen.queryByRole("button", { name: "使用已保存搜索：launch" })).toBeNull();
    expect(JSON.parse(localStorage.getItem("cstd-design:saved-searches") || "[]")).toEqual([]);
    expect(input.value).toBe("");
  });
});
