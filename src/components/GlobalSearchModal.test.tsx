import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GlobalSearchModal } from "./GlobalSearchModal";

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
});
