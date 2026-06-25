import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ConversationTitleInput } from "./ConversationTitleInput";

describe("ConversationTitleInput", () => {
  test("renders with initial title", () => {
    render(<ConversationTitleInput title="My Chat" disabled={false} onCommit={vi.fn()} />);
    expect(screen.getByDisplayValue("My Chat")).toBeTruthy();
  });

  test("is disabled when disabled prop is true", () => {
    render(<ConversationTitleInput title="Chat" disabled={true} onCommit={vi.fn()} />);
    expect((screen.getByDisplayValue("Chat") as HTMLInputElement).disabled).toBe(true);
  });

  test("calls onCommit on blur", async () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ConversationTitleInput title="Old" disabled={false} onCommit={onCommit} />);
    const input = screen.getByDisplayValue("Old");
    await user.clear(input);
    await user.type(input, "New Title");
    await user.tab();
    expect(onCommit).toHaveBeenCalledWith("New Title");
  });

  test("reverts to original title if empty", async () => {
    const onCommit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ConversationTitleInput title="Original" disabled={false} onCommit={onCommit} />);
    const input = screen.getByDisplayValue("Original");
    await user.clear(input);
    await user.tab();
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("Original")).toBeTruthy();
  });
});
